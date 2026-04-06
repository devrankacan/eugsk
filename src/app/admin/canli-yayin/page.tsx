'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import AdminHeader from '@/components/admin/AdminHeader'
import Button from '@/components/ui/Button'
import ImageUpload from '@/components/ui/ImageUpload'
import { Radio, Square, Users, Monitor, Camera, ExternalLink, Mic, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

interface MatchInfo {
  homeTeam: string
  homeLogo: string
  awayTeam: string
  awayLogo: string
  branch: string
  category: string
  venue: string
}

const defaultMatchInfo: MatchInfo = {
  homeTeam: '', homeLogo: '', awayTeam: '', awayLogo: '',
  branch: '', category: '', venue: '',
}

export default function AdminCanliYayin() {
  const [isLive, setIsLive] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [scores, setScores] = useState({ home: 0, away: 0 })
  const [matchInfo, setMatchInfo] = useState<MatchInfo>(defaultMatchInfo)
  const [mediaMode, setMediaMode] = useState<'camera' | 'screen'>('camera')
  const [starting, setStarting] = useState(false)
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [selectedMic, setSelectedMic] = useState<string>('')
  const [switchingDevice, setSwitchingDevice] = useState(false)

  const socketRef = useRef<Socket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const peersRef = useRef<Record<string, RTCPeerConnection>>({})

  // Cihaz listesini yükle
  const loadDevices = useCallback(async () => {
    try {
      // Önce izin iste (etiketler yalnızca izin sonrası görünür)
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(s => s.getTracks().forEach(t => t.stop())).catch(() => {})
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videos = devices.filter(d => d.kind === 'videoinput')
      const audios = devices.filter(d => d.kind === 'audioinput')
      setVideoDevices(videos)
      setAudioDevices(audios)
      if (videos.length > 0 && !selectedCamera) setSelectedCamera(videos[0].deviceId)
      if (audios.length > 0 && !selectedMic) setSelectedMic(audios[0].deviceId)
    } catch {
      // izin reddedilirse sessizce geç
    }
  }, [selectedCamera, selectedMic])

  useEffect(() => {
    loadDevices()
    navigator.mediaDevices.addEventListener('devicechange', loadDevices)
    return () => navigator.mediaDevices.removeEventListener('devicechange', loadDevices)
  }, [loadDevices])

  // Yayın canlıyken cihaz değiştir (yayını kesmeden)
  const switchDevice = useCallback(async (type: 'video' | 'audio', deviceId: string) => {
    if (!isLive || !streamRef.current) return
    setSwitchingDevice(true)
    try {
      const constraints = type === 'video'
        ? { video: { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } }, audio: false }
        : { video: false, audio: { deviceId: { exact: deviceId } } }
      const newStream = await navigator.mediaDevices.getUserMedia(constraints as MediaStreamConstraints)
      const newTrack = newStream.getTracks()[0]

      // Tüm peer bağlantılarında track'i değiştir
      Object.values(peersRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === newTrack.kind)
        sender?.replaceTrack(newTrack)
      })

      // Mevcut stream'deki eski track'i durdur ve yenisiyle değiştir
      const oldTrack = streamRef.current.getTracks().find(t => t.kind === newTrack.kind)
      if (oldTrack) {
        streamRef.current.removeTrack(oldTrack)
        oldTrack.stop()
      }
      streamRef.current.addTrack(newTrack)

      // Preview güncelle
      if (videoRef.current && type === 'video') {
        videoRef.current.srcObject = streamRef.current
      }
    } catch (err: any) {
      toast.error('Cihaz geçişi başarısız: ' + (err.message || ''))
    } finally {
      setSwitchingDevice(false)
    }
  }, [isLive])

  // Socket setup
  useEffect(() => {
    const socket = io({ transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('viewer-joined', async ({ viewerId }: { viewerId: string }) => {
      if (!streamRef.current) return
      const pc = new RTCPeerConnection(ICE_SERVERS)
      peersRef.current[viewerId] = pc

      streamRef.current.getTracks().forEach(track =>
        pc.addTrack(track, streamRef.current!)
      )

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', { targetId: viewerId, candidate: e.candidate })
        }
      }

      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('offer', { targetId: viewerId, offer })
      } catch (err) {
        console.error('Offer error:', err)
      }
    })

    socket.on('answer', async ({ senderId, answer }: any) => {
      try {
        await peersRef.current[senderId]?.setRemoteDescription(answer)
      } catch (err) {
        console.error('Answer error:', err)
      }
    })

    socket.on('ice-candidate', async ({ senderId, candidate }: any) => {
      try {
        await peersRef.current[senderId]?.addIceCandidate(candidate)
      } catch (err) {
        console.error('ICE error:', err)
      }
    })

    socket.on('viewer-count', (count: number) => setViewerCount(count))

    return () => { socket.disconnect() }
  }, [])

  async function startStream() {
    if (!matchInfo.homeTeam || !matchInfo.awayTeam) {
      toast.error('Ev sahibi ve deplasman takım adı gerekli')
      return
    }
    setStarting(true)
    try {
      let stream: MediaStream
      if (mediaMode === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 } as any,
          audio: true,
        })
      } else {
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 },
        }
        if (selectedCamera) videoConstraints.deviceId = { exact: selectedCamera }
        const audioConstraints: boolean | MediaTrackConstraints = selectedMic
          ? { deviceId: { exact: selectedMic } }
          : true
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        })
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      // Handle stream ending (screen share stop button)
      stream.getVideoTracks()[0].onended = () => stopStream()

      socketRef.current?.emit('start-broadcast', { matchInfo })
      setIsLive(true)
      toast.success('Yayın başladı!')
    } catch (err: any) {
      toast.error('Kamera/ekran erişimi alınamadı: ' + (err.message || ''))
    } finally {
      setStarting(false)
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    Object.values(peersRef.current).forEach(pc => pc.close())
    peersRef.current = {}
    if (videoRef.current) videoRef.current.srcObject = null
    socketRef.current?.emit('stop-broadcast')
    setIsLive(false)
    setViewerCount(0)
    setScores({ home: 0, away: 0 })
    toast('Yayın durduruldu')
  }

  const updateScore = useCallback((team: 'home' | 'away', delta: number) => {
    setScores(prev => {
      const next = { ...prev, [team]: Math.max(0, prev[team] + delta) }
      socketRef.current?.emit('update-score', next)
      return next
    })
  }, [])

  function handleMatchField(field: keyof MatchInfo, value: string) {
    setMatchInfo(prev => {
      const updated = { ...prev, [field]: value }
      if (isLive) socketRef.current?.emit('update-match', updated)
      return updated
    })
  }

  const viewerUrl = typeof window !== 'undefined' ? `${window.location.origin}/canli-yayin` : '/canli-yayin'

  return (
    <div>
      <AdminHeader title="Canlı Yayın" />
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Live badge */}
        {isLive && (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="font-black text-red-600 tracking-wider">CANLI YAYIN</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <Users size={14} /> {viewerCount} izleyici
              </span>
              <a href={viewerUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
                <ExternalLink size={14} /> Yayını İzle
              </a>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Match setup (3 cols) ── */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Maç Bilgileri</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Ev Sahibi Takım *</label>
                <input type="text" value={matchInfo.homeTeam}
                  onChange={e => handleMatchField('homeTeam', e.target.value)}
                  className="form-input" placeholder="Takım adı" />
              </div>
              <div>
                <label className="form-label">Deplasman Takım *</label>
                <input type="text" value={matchInfo.awayTeam}
                  onChange={e => handleMatchField('awayTeam', e.target.value)}
                  className="form-input" placeholder="Takım adı" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Ev Sahibi Logo</label>
                <ImageUpload value={matchInfo.homeLogo}
                  onChange={url => handleMatchField('homeLogo', url)} label="Logo Yükle" />
              </div>
              <div>
                <label className="form-label">Deplasman Logo</label>
                <ImageUpload value={matchInfo.awayLogo}
                  onChange={url => handleMatchField('awayLogo', url)} label="Logo Yükle" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="form-label">Branş</label>
                <input type="text" value={matchInfo.branch}
                  onChange={e => handleMatchField('branch', e.target.value)}
                  className="form-input" placeholder="Futbol" />
              </div>
              <div>
                <label className="form-label">Kategori</label>
                <input type="text" value={matchInfo.category}
                  onChange={e => handleMatchField('category', e.target.value)}
                  className="form-input" placeholder="A Takımı" />
              </div>
              <div>
                <label className="form-label">Saha / Mekan</label>
                <input type="text" value={matchInfo.venue}
                  onChange={e => handleMatchField('venue', e.target.value)}
                  className="form-input" placeholder="Stadyum adı" />
              </div>
            </div>

            {/* Scoreboard preview */}
            <div className="mt-2 rounded-xl bg-primary p-4">
              <p className="text-xs text-white/50 text-center mb-3 uppercase tracking-wider font-semibold">Skor Tahtası Önizleme</p>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {matchInfo.homeLogo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={matchInfo.homeLogo} alt="" className="w-8 h-8 object-contain shrink-0" />
                    : <div className="w-8 h-8 bg-white/20 rounded shrink-0" />
                  }
                  <span className="text-white font-bold text-sm truncate">{matchInfo.homeTeam || 'Ev Sahibi'}</span>
                </div>
                <div className="text-center shrink-0">
                  <div className="text-white font-black text-2xl tabular-nums">{scores.home} - {scores.away}</div>
                  <div className="text-secondary text-xs">{matchInfo.branch || 'Branş'} {matchInfo.category && `• ${matchInfo.category}`}</div>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-white font-bold text-sm truncate">{matchInfo.awayTeam || 'Deplasman'}</span>
                  {matchInfo.awayLogo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={matchInfo.awayLogo} alt="" className="w-8 h-8 object-contain shrink-0" />
                    : <div className="w-8 h-8 bg-white/20 rounded shrink-0" />
                  }
                </div>
              </div>
            </div>
          </div>

          {/* ── Stream controls (2 cols) ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Camera preview */}
            <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              {!isLive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                  <Camera size={32} className="mb-2" />
                  <span className="text-sm">Önizleme</span>
                </div>
              )}
              {isLive && (
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </div>
              )}
            </div>

            {/* Media mode */}
            {!isLive && (
              <div className="flex gap-2">
                <button onClick={() => setMediaMode('camera')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mediaMode === 'camera' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <Camera size={15} /> Kamera
                </button>
                <button onClick={() => setMediaMode('screen')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mediaMode === 'screen' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <Monitor size={15} /> Ekran
                </button>
              </div>
            )}

            {/* Harici cihaz seçimi — sadece kamera modunda */}
            {mediaMode === 'camera' && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cihaz Seçimi</span>
                  <button
                    onClick={loadDevices}
                    title="Cihazları yenile"
                    className="text-gray-400 hover:text-primary transition-colors p-0.5 rounded"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>

                {/* Kamera seç */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <Camera size={11} /> Kamera
                  </label>
                  <select
                    value={selectedCamera}
                    onChange={e => {
                      setSelectedCamera(e.target.value)
                      if (isLive) switchDevice('video', e.target.value)
                    }}
                    disabled={switchingDevice}
                    className="w-full text-xs rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-wait"
                  >
                    {videoDevices.length === 0
                      ? <option value="">— Cihaz bulunamadı —</option>
                      : videoDevices.map(d => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Kamera ${videoDevices.indexOf(d) + 1}`}
                          </option>
                        ))
                    }
                  </select>
                </div>

                {/* Mikrofon seç */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <Mic size={11} /> Mikrofon
                  </label>
                  <select
                    value={selectedMic}
                    onChange={e => {
                      setSelectedMic(e.target.value)
                      if (isLive) switchDevice('audio', e.target.value)
                    }}
                    disabled={switchingDevice}
                    className="w-full text-xs rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-wait"
                  >
                    {audioDevices.length === 0
                      ? <option value="">— Cihaz bulunamadı —</option>
                      : audioDevices.map(d => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Mikrofon ${audioDevices.indexOf(d) + 1}`}
                          </option>
                        ))
                    }
                  </select>
                </div>

                {switchingDevice && (
                  <p className="text-[10px] text-primary/70 text-center animate-pulse">Cihaz değiştiriliyor...</p>
                )}
                {isLive && !switchingDevice && (
                  <p className="text-[10px] text-green-600 text-center">Yayın kesilmeden cihaz değiştirilebilir</p>
                )}
              </div>
            )}

            {/* Start / Stop */}
            {!isLive ? (
              <Button onClick={startStream} loading={starting}
                className="w-full py-3 text-base !bg-red-600 hover:!bg-red-700 flex items-center justify-center gap-2">
                <Radio size={18} /> Yayını Başlat
              </Button>
            ) : (
              <button onClick={stopStream}
                className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold text-base hover:bg-gray-900 transition-all flex items-center justify-center gap-2">
                <Square size={18} /> Yayını Durdur
              </button>
            )}

            {/* Score controls — only when live */}
            {isLive && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-bold text-gray-900 text-sm mb-4 text-center">Skor Kontrolü</h3>
                <div className="flex items-center justify-center gap-6">
                  {/* Home */}
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-500 mb-2 truncate font-medium">{matchInfo.homeTeam || 'Ev Sahibi'}</p>
                    <div className="flex items-center gap-2 justify-center">
                      <button onClick={() => updateScore('home', -1)}
                        className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-100 hover:text-red-600 font-black text-lg transition-all">−</button>
                      <span className="text-3xl font-black text-primary w-10 text-center tabular-nums">{scores.home}</span>
                      <button onClick={() => updateScore('home', 1)}
                        className="w-9 h-9 rounded-xl bg-primary text-white hover:bg-primary-700 font-black text-lg transition-all">+</button>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-gray-300">-</span>
                  {/* Away */}
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-500 mb-2 truncate font-medium">{matchInfo.awayTeam || 'Deplasman'}</p>
                    <div className="flex items-center gap-2 justify-center">
                      <button onClick={() => updateScore('away', -1)}
                        className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-100 hover:text-red-600 font-black text-lg transition-all">−</button>
                      <span className="text-3xl font-black text-primary w-10 text-center tabular-nums">{scores.away}</span>
                      <button onClick={() => updateScore('away', 1)}
                        className="w-9 h-9 rounded-xl bg-primary text-white hover:bg-primary-700 font-black text-lg transition-all">+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
