'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import AdminHeader from '@/components/admin/AdminHeader'
import Button from '@/components/ui/Button'
import ImageUpload from '@/components/ui/ImageUpload'
import { Radio, Square, Users, Monitor, Camera, ExternalLink, Play, Pause, Timer } from 'lucide-react'
import toast from 'react-hot-toast'

interface TimerState {
  running: boolean
  startedAt: number | null
  elapsed: number
  half: 1 | 2
  extraTime: number
}

function computeTimerDisplay(timer: TimerState): string {
  const raw = timer.running && timer.startedAt
    ? timer.elapsed + (Date.now() - timer.startedAt)
    : timer.elapsed
  const halfBase = timer.half === 2 ? 45 * 60 * 1000 : 0
  const halfCap  = 45 * 60 * 1000
  const extraMs  = (timer.extraTime || 0) * 60 * 1000
  const clamped  = Math.min(raw, halfCap + extraMs)
  const totalMs  = halfBase + clamped
  const normalMax = halfBase + halfCap
  if (totalMs > normalMax) {
    const capMin   = timer.half === 1 ? 45 : 90
    const extraSec = Math.floor((totalMs - normalMax) / 1000)
    return `${capMin}+${Math.floor(extraSec / 60) + 1}'`
  }
  const s = Math.floor(totalMs / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

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

  // Timer
  const timerLocalRef = useRef<TimerState>({ running: false, startedAt: null, elapsed: 0, half: 1, extraTime: 0 })
  const [timerDisplay, setTimerDisplay] = useState('00:00')
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerHalf, setTimerHalf] = useState<1 | 2>(1)
  const [extraInput, setExtraInput] = useState('')

  // Events form
  const [eventType, setEventType] = useState<'goal' | 'yellow_card' | 'red_card' | 'substitution'>('goal')
  const [eventTeam, setEventTeam] = useState<'home' | 'away'>('home')
  const [eventPlayer, setEventPlayer] = useState('')
  const [eventPlayerOut, setEventPlayerOut] = useState('')
  const [eventPlayerIn, setEventPlayerIn] = useState('')
  const [eventMinute, setEventMinute] = useState('')

  const socketRef = useRef<Socket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const peersRef = useRef<Record<string, RTCPeerConnection>>({})
  const iceCandidateQueues = useRef<Record<string, RTCIceCandidateInit[]>>({})
  const remoteDescSet = useRef<Record<string, boolean>>({})

  // Timer display interval
  useEffect(() => {
    const iv = setInterval(() => {
      setTimerDisplay(computeTimerDisplay(timerLocalRef.current))
    }, 250)
    return () => clearInterval(iv)
  }, [])

  function emitTimer(t: TimerState) {
    timerLocalRef.current = t
    setTimerRunning(t.running)
    setTimerHalf(t.half)
    socketRef.current?.emit('update-timer', t)
  }

  function startTimer() {
    const t = timerLocalRef.current
    if (t.running) return
    emitTimer({ ...t, running: true, startedAt: Date.now() })
  }

  function pauseTimer() {
    const t = timerLocalRef.current
    if (!t.running || !t.startedAt) return
    emitTimer({ ...t, running: false, elapsed: t.elapsed + (Date.now() - t.startedAt), startedAt: null })
  }

  function switchHalf(half: 1 | 2) {
    emitTimer({ running: false, startedAt: null, elapsed: 0, half, extraTime: 0 })
    setExtraInput('')
  }

  function applyExtraTime() {
    const extra = Math.max(0, parseInt(extraInput) || 0)
    emitTimer({ ...timerLocalRef.current, extraTime: extra })
    setExtraInput('')
    toast.success(`+${extra}' ilave süre ayarlandı`)
  }

  function submitEvent() {
    const payload: any = { type: eventType, team: eventTeam }
    if (eventMinute) payload.minute = parseInt(eventMinute)
    if (eventType === 'substitution') {
      if (eventPlayerOut) payload.playerOut = eventPlayerOut
      if (eventPlayerIn) payload.playerIn = eventPlayerIn
    } else {
      if (eventPlayer) payload.player = eventPlayer
    }
    socketRef.current?.emit('add-match-event', payload)
    setEventPlayer(''); setEventPlayerOut(''); setEventPlayerIn(''); setEventMinute('')
    toast.success('Olay yayınlandı')
  }

  // Socket setup
  useEffect(() => {
    const socket = io({ transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('viewer-joined', async ({ viewerId }: { viewerId: string }) => {
      if (!streamRef.current) return
      const pc = new RTCPeerConnection(ICE_SERVERS)
      peersRef.current[viewerId] = pc
      iceCandidateQueues.current[viewerId] = []
      remoteDescSet.current[viewerId] = false

      streamRef.current.getTracks().forEach(track =>
        pc.addTrack(track, streamRef.current!)
      )

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', { targetId: viewerId, candidate: e.candidate })
        }
      }

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          pc.restartIce()
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
      const pc = peersRef.current[senderId]
      if (!pc) return
      try {
        await pc.setRemoteDescription(answer)
        remoteDescSet.current[senderId] = true
        // Flush queued ICE candidates for this viewer
        for (const candidate of (iceCandidateQueues.current[senderId] || [])) {
          await pc.addIceCandidate(candidate).catch(() => {})
        }
        iceCandidateQueues.current[senderId] = []
      } catch (err) {
        console.error('Answer error:', err)
      }
    })

    socket.on('ice-candidate', async ({ senderId, candidate }: any) => {
      if (!candidate) return
      const pc = peersRef.current[senderId]
      if (pc && remoteDescSet.current[senderId]) {
        await pc.addIceCandidate(candidate).catch(() => {})
      } else {
        // Queue until remote description is set
        if (!iceCandidateQueues.current[senderId]) iceCandidateQueues.current[senderId] = []
        iceCandidateQueues.current[senderId].push(candidate)
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
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
          audio: true,
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
    iceCandidateQueues.current = {}
    remoteDescSet.current = {}
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

            {/* Yayın grafikleri — only when live */}
            {isLive && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm text-center">Yayın Grafikleri</h3>

                {/* Tanıtım */}
                <button
                  onClick={() => { socketRef.current?.emit('show-intro'); toast.success('Tanıtım gösteriliyor') }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all"
                >
                  🎬 Tanıtımı Göster
                </button>

                {/* Kronometre */}
                <div className="border border-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                      <Timer size={12} /> KRONOMETRe
                    </span>
                    <span className="font-black text-base tabular-nums text-primary">{timerDisplay}</span>
                  </div>

                  {/* Devre seçimi */}
                  <div className="flex gap-1.5">
                    <button onClick={() => switchHalf(1)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${timerHalf === 1 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      1. Devre
                    </button>
                    <button onClick={() => switchHalf(2)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${timerHalf === 2 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      2. Devre
                    </button>
                  </div>

                  {/* Başlat / Duraklat */}
                  <button
                    onClick={timerRunning ? pauseTimer : startTimer}
                    className={`w-full py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${timerRunning ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                  >
                    {timerRunning ? <><Pause size={14} /> Duraklat</> : <><Play size={14} /> Başlat</>}
                  </button>

                  {/* İlave süre */}
                  <div className="flex gap-1.5">
                    <input
                      type="number" min="0" max="20"
                      placeholder="+dk"
                      value={extraInput}
                      onChange={e => setExtraInput(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button onClick={applyExtraTime}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all">
                      İlave Süre
                    </button>
                  </div>
                </div>

                {/* Maç Olayları */}
                <div className="border border-gray-100 rounded-lg p-3 space-y-2">
                  <span className="text-xs font-bold text-gray-500">MAÇ OLAYLARI</span>

                  {/* Tip + Takım */}
                  <div className="flex gap-1.5">
                    <select
                      value={eventType}
                      onChange={e => setEventType(e.target.value as any)}
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="goal">⚽ Gol</option>
                      <option value="yellow_card">🟨 Sarı Kart</option>
                      <option value="red_card">🟥 Kırmızı Kart</option>
                      <option value="substitution">🔄 Değişiklik</option>
                    </select>
                    <select
                      value={eventTeam}
                      onChange={e => setEventTeam(e.target.value as any)}
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="home">{matchInfo.homeTeam || 'Ev Sahibi'}</option>
                      <option value="away">{matchInfo.awayTeam || 'Deplasman'}</option>
                    </select>
                  </div>

                  {/* Oyuncu alanları */}
                  {eventType === 'substitution' ? (
                    <div className="flex gap-1.5">
                      <input type="text" placeholder="Çıkan oyuncu" value={eventPlayerOut}
                        onChange={e => setEventPlayerOut(e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
                      <input type="text" placeholder="Giren oyuncu" value={eventPlayerIn}
                        onChange={e => setEventPlayerIn(e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  ) : (
                    <input type="text" placeholder="Oyuncu adı (opsiyonel)" value={eventPlayer}
                      onChange={e => setEventPlayer(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
                  )}

                  {/* Dakika + Gönder */}
                  <div className="flex gap-1.5">
                    <input type="number" placeholder="Dakika" value={eventMinute}
                      onChange={e => setEventMinute(e.target.value)}
                      className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary" />
                    <button onClick={submitEvent}
                      className="flex-1 py-1.5 bg-primary hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-all">
                      Yayınla
                    </button>
                  </div>
                </div>
              </div>
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
