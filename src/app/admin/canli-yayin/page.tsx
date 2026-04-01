'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import AdminHeader from '@/components/admin/AdminHeader'
import Button from '@/components/ui/Button'
import ImageUpload from '@/components/ui/ImageUpload'
import { Radio, Square, Users, Monitor, Camera, ExternalLink, FlipHorizontal, ZoomIn, Clock, Pause, Play } from 'lucide-react'
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

interface KJPreset {
  type: string
  icon: string
  label: string
  hasTeam?: boolean
  hasPlayer?: boolean
  hasMinute?: boolean
  hasExtra?: string
}

const BRANCH_KJ: Record<string, KJPreset[]> = {
  futbol: [
    { type: 'goal', icon: '⚽', label: 'Gol', hasTeam: true, hasPlayer: true, hasMinute: true },
    { type: 'yellowCard', icon: '🟨', label: 'Sarı Kart', hasTeam: true, hasPlayer: true, hasMinute: true },
    { type: 'redCard', icon: '🟥', label: 'Kırmızı Kart', hasTeam: true, hasPlayer: true, hasMinute: true },
    { type: 'sub', icon: '🔄', label: 'Değişiklik', hasTeam: true, hasPlayer: true, hasExtra: 'Çıkan Oyuncu' },
    { type: 'extraTime', icon: '⏱', label: 'Uzatma', hasExtra: 'Uzatma Dakikaları (ör: +3)' },
    { type: 'penalty', icon: '🥅', label: 'Penaltı', hasTeam: true, hasMinute: true },
    { type: 'offside', icon: '🚩', label: 'Ofsayt', hasTeam: true },
    { type: 'injury', icon: '🩹', label: 'Sakatlık', hasTeam: true, hasPlayer: true },
    { type: 'info', icon: '📋', label: 'Bilgi', hasExtra: 'Metin' },
  ],
  voleybol: [
    { type: 'setWon', icon: '🏐', label: 'Set Kazandı', hasTeam: true, hasExtra: 'Set Skoru (ör: 2-1)' },
    { type: 'timeout', icon: '⏱', label: 'Mola', hasTeam: true },
    { type: 'serve', icon: '🔄', label: 'Servis Değişikliği', hasTeam: true },
    { type: 'sub', icon: '↔️', label: 'Oyuncu Değişikliği', hasTeam: true, hasPlayer: true },
    { type: 'info', icon: '📋', label: 'Bilgi', hasExtra: 'Metin' },
  ],
  basketbol: [
    { type: 'score', icon: '🏀', label: 'Sayı', hasTeam: true, hasPlayer: true },
    { type: 'foul', icon: '🟡', label: 'Faul', hasTeam: true, hasPlayer: true },
    { type: 'timeout', icon: '⏱', label: 'Mola', hasTeam: true },
    { type: 'sub', icon: '🔄', label: 'Değişiklik', hasTeam: true, hasPlayer: true },
    { type: 'quarter', icon: '🔔', label: 'Çeyrek Bitti' },
    { type: 'info', icon: '📋', label: 'Bilgi', hasExtra: 'Metin' },
  ],
  hentbol: [
    { type: 'goal', icon: '🤾', label: 'Gol', hasTeam: true, hasPlayer: true, hasMinute: true },
    { type: 'yellowCard', icon: '🟨', label: 'Sarı Kart', hasTeam: true, hasPlayer: true },
    { type: 'redCard', icon: '🟥', label: 'Kırmızı Kart', hasTeam: true, hasPlayer: true },
    { type: 'timeout', icon: '⏱', label: 'Mola', hasTeam: true },
    { type: 'penalty', icon: '🥅', label: 'Penaltı', hasTeam: true },
    { type: 'info', icon: '📋', label: 'Bilgi', hasExtra: 'Metin' },
  ],
}

const DEFAULT_KJ: KJPreset[] = [
  { type: 'goal', icon: '🏅', label: 'Sayı/Gol', hasTeam: true, hasPlayer: true },
  { type: 'card', icon: '🟨', label: 'Kart/Ceza', hasTeam: true, hasPlayer: true },
  { type: 'sub', icon: '🔄', label: 'Değişiklik', hasTeam: true, hasPlayer: true },
  { type: 'timeout', icon: '⏱', label: 'Mola', hasTeam: true },
  { type: 'info', icon: '📋', label: 'Bilgi', hasExtra: 'Metin' },
]

function pad(n: number) { return String(n).padStart(2, '0') }

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${pad(s % 60)}`
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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number } | null>(null)
  const [isHalfTime, setIsHalfTime] = useState(false)
  const [homeColor, setHomeColor] = useState('#1e3a8a')
  const [awayColor, setAwayColor] = useState('#7f1d1d')
  const [matchStartTime, setMatchStartTime] = useState<number | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [selectedKJ, setSelectedKJ] = useState<KJPreset | null>(null)
  const [kjPlayer, setKjPlayer] = useState('')
  const [kjMinute, setKjMinute] = useState('')
  const [kjExtra, setKjExtra] = useState('')
  const [kjTeam, setKjTeam] = useState<'home' | 'away'>('home')

  const socketRef = useRef<Socket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const peersRef = useRef<Record<string, RTCPeerConnection>>({})
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer tick
  useEffect(() => {
    if (timerRunning && matchStartTime) {
      timerIntervalRef.current = setInterval(() => setElapsed(Date.now() - matchStartTime), 500)
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current) }
  }, [timerRunning, matchStartTime])

  // Branch detection
  const branchKey = matchInfo.branch.toLowerCase()
  const isFutbol = branchKey.includes('futbol') || branchKey.includes('football')
  const kjPresets = BRANCH_KJ[
    isFutbol ? 'futbol'
    : branchKey.includes('voley') ? 'voleybol'
    : branchKey.includes('basket') ? 'basketbol'
    : branchKey.includes('hentbol') ? 'hentbol'
    : ''
  ] || DEFAULT_KJ

  // Socket setup
  useEffect(() => {
    const socket = io({ transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('viewer-joined', async ({ viewerId }: { viewerId: string }) => {
      if (!streamRef.current) return
      const pc = new RTCPeerConnection(ICE_SERVERS)
      peersRef.current[viewerId] = pc
      streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current!))
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('ice-candidate', { targetId: viewerId, candidate: e.candidate })
      }
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('offer', { targetId: viewerId, offer })
      } catch (err) { console.error('Offer error:', err) }
    })

    socket.on('answer', async ({ senderId, answer }: any) => {
      try { await peersRef.current[senderId]?.setRemoteDescription(answer) } catch {}
    })
    socket.on('ice-candidate', async ({ senderId, candidate }: any) => {
      try { await peersRef.current[senderId]?.addIceCandidate(candidate) } catch {}
    })
    socket.on('viewer-count', (count: number) => setViewerCount(count))

    return () => { socket.disconnect() }
  }, [])

  async function setupZoom(track: MediaStreamTrack) {
    const capabilities = (track as any).getCapabilities?.()
    if (capabilities?.zoom) {
      setZoomRange({ min: capabilities.zoom.min, max: capabilities.zoom.max })
      setZoomLevel(capabilities.zoom.min || 1)
    } else {
      setZoomRange(null)
    }
  }

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
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          },
          audio: true,
        })
        const vTrack = stream.getVideoTracks()[0]
        if (vTrack) await setupZoom(vTrack)
      }
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      stream.getVideoTracks()[0].onended = () => stopStream()

      socketRef.current?.emit('start-broadcast', { matchInfo })
      socketRef.current?.emit('update-colors', { homeColor, awayColor })
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
    setIsHalfTime(false)
    setTimerRunning(false)
    setMatchStartTime(null)
    setZoomRange(null)
    toast('Yayın durduruldu')
  }

  async function switchCamera() {
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    if (!isLive) { setFacingMode(newFacing); return }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: newFacing }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: false,
      })
      const newVideoTrack = newStream.getVideoTracks()[0]
      await setupZoom(newVideoTrack)
      // Replace track in all peer connections
      for (const pc of Object.values(peersRef.current)) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender) await sender.replaceTrack(newVideoTrack)
      }
      // Replace in local stream
      const oldTrack = streamRef.current?.getVideoTracks()[0]
      if (oldTrack) {
        streamRef.current?.removeTrack(oldTrack)
        oldTrack.stop()
      }
      streamRef.current?.addTrack(newVideoTrack)
      newVideoTrack.onended = () => stopStream()
      if (videoRef.current) {
        const audio = streamRef.current?.getAudioTracks() || []
        videoRef.current.srcObject = new MediaStream([newVideoTrack, ...audio])
      }
      setFacingMode(newFacing)
      toast.success(newFacing === 'environment' ? 'Arka kameraya geçildi' : 'Ön kameraya geçildi')
    } catch (err: any) {
      toast.error('Kamera değiştirilemedi')
    }
  }

  async function applyZoom(value: number) {
    setZoomLevel(value)
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try { await (track as any).applyConstraints({ advanced: [{ zoom: value }] }) } catch {}
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

  function handleColorChange(team: 'home' | 'away', color: string) {
    if (team === 'home') setHomeColor(color)
    else setAwayColor(color)
    if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current)
    colorDebounceRef.current = setTimeout(() => {
      socketRef.current?.emit('update-colors', {
        homeColor: team === 'home' ? color : homeColor,
        awayColor: team === 'away' ? color : awayColor,
      })
    }, 150)
  }

  function toggleHalfTime() {
    const next = !isHalfTime
    setIsHalfTime(next)
    socketRef.current?.emit('toggle-half-time', next)
    toast(next ? 'Devre arası açıldı' : 'Devre arası kapatıldı')
  }

  function startTimer() {
    const now = Date.now()
    setMatchStartTime(now)
    setTimerRunning(true)
    socketRef.current?.emit('start-timer')
    toast.success('Süre başladı')
  }

  function stopTimer() {
    setTimerRunning(false)
    socketRef.current?.emit('stop-timer')
    toast('Süre durduruldu')
  }

  function sendKJ() {
    if (!selectedKJ) return
    const teamName = kjTeam === 'home' ? matchInfo.homeTeam : matchInfo.awayTeam
    let subtitle = ''
    if (selectedKJ.hasPlayer && kjPlayer) subtitle += kjPlayer
    if (selectedKJ.hasMinute && kjMinute) subtitle += (subtitle ? ' · ' : '') + kjMinute + "'"
    if (selectedKJ.hasExtra && kjExtra) subtitle += (subtitle ? ' · ' : '') + kjExtra

    const kj = {
      type: selectedKJ.type,
      icon: selectedKJ.icon,
      title: selectedKJ.hasTeam ? `${selectedKJ.label} — ${teamName}` : selectedKJ.label,
      subtitle: subtitle || undefined,
      team: selectedKJ.hasTeam ? kjTeam : null,
      duration: 6000,
    }
    socketRef.current?.emit('send-kj', kj)
    setKjPlayer('')
    setKjMinute('')
    setKjExtra('')
    toast.success('KJ gönderildi')
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
              {timerRunning && matchStartTime && (
                <span className="text-red-500 font-mono font-bold text-sm">{formatElapsed(elapsed)}</span>
              )}
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
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
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

              {/* Team colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Ev Sahibi Rengi</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={homeColor}
                      onChange={e => handleColorChange('home', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-1" />
                    <span className="text-xs text-gray-400 font-mono">{homeColor}</span>
                  </div>
                </div>
                <div>
                  <label className="form-label">Deplasman Rengi</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={awayColor}
                      onChange={e => handleColorChange('away', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-1" />
                    <span className="text-xs text-gray-400 font-mono">{awayColor}</span>
                  </div>
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
                    <div className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: homeColor }} />
                    {matchInfo.homeLogo
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={matchInfo.homeLogo} alt="" className="w-8 h-8 object-contain shrink-0" />
                      : <div className="w-8 h-8 rounded shrink-0" style={{ backgroundColor: homeColor + '60' }} />
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
                      : <div className="w-8 h-8 rounded shrink-0" style={{ backgroundColor: awayColor + '60' }} />
                    }
                    <div className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: awayColor }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── KJ Panel (only when live) ── */}
            {isLive && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-gray-900 text-base">
                  KJ Grafikleri
                  {matchInfo.branch && <span className="ml-2 text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">{matchInfo.branch}</span>}
                </h3>

                {/* KJ type buttons */}
                <div className="flex flex-wrap gap-2">
                  {kjPresets.map(kj => (
                    <button
                      key={kj.type}
                      onClick={() => setSelectedKJ(selectedKJ?.type === kj.type ? null : kj)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedKJ?.type === kj.type ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      <span>{kj.icon}</span> {kj.label}
                    </button>
                  ))}
                </div>

                {/* KJ form */}
                {selectedKJ && (
                  <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
                    {selectedKJ.hasTeam && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setKjTeam('home')}
                          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${kjTeam === 'home' ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                          style={kjTeam === 'home' ? { backgroundColor: homeColor } : {}}
                        >
                          {matchInfo.homeTeam || 'Ev Sahibi'}
                        </button>
                        <button
                          onClick={() => setKjTeam('away')}
                          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${kjTeam === 'away' ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                          style={kjTeam === 'away' ? { backgroundColor: awayColor } : {}}
                        >
                          {matchInfo.awayTeam || 'Deplasman'}
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {selectedKJ.hasPlayer && (
                        <div>
                          <label className="form-label">Oyuncu Adı</label>
                          <input type="text" value={kjPlayer} onChange={e => setKjPlayer(e.target.value)}
                            className="form-input" placeholder="Ad Soyad" />
                        </div>
                      )}
                      {selectedKJ.hasMinute && (
                        <div>
                          <label className="form-label">Dakika</label>
                          <input type="text" value={kjMinute} onChange={e => setKjMinute(e.target.value)}
                            className="form-input" placeholder="45" />
                        </div>
                      )}
                      {selectedKJ.hasExtra && (
                        <div className={selectedKJ.hasPlayer || selectedKJ.hasMinute ? '' : 'col-span-2'}>
                          <label className="form-label">{selectedKJ.hasExtra}</label>
                          <input type="text" value={kjExtra} onChange={e => setKjExtra(e.target.value)}
                            className="form-input" placeholder={selectedKJ.hasExtra} />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={sendKJ}
                      className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                    >
                      <span>{selectedKJ.icon}</span> KJ Gönder
                    </button>
                  </div>
                )}
              </div>
            )}
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

            {/* Media mode + camera controls */}
            {!isLive && (
              <div className="space-y-2">
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
                {mediaMode === 'camera' && (
                  <button onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
                    <FlipHorizontal size={15} />
                    {facingMode === 'environment' ? 'Arka Kamera' : 'Ön Kamera'} (değiştir)
                  </button>
                )}
              </div>
            )}

            {/* Camera switch when live */}
            {isLive && mediaMode === 'camera' && (
              <button onClick={switchCamera}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
                <FlipHorizontal size={15} />
                {facingMode === 'environment' ? 'Ön Kameraya Geç' : 'Arka Kameraya Geç'}
              </button>
            )}

            {/* Zoom slider */}
            {isLive && mediaMode === 'camera' && zoomRange && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                    <ZoomIn size={13} /> Zoom
                  </label>
                  <span className="text-xs text-gray-400 font-mono">{zoomLevel.toFixed(1)}×</span>
                </div>
                <input
                  type="range"
                  min={zoomRange.min}
                  max={zoomRange.max}
                  step={(zoomRange.max - zoomRange.min) / 100}
                  value={zoomLevel}
                  onInput={e => applyZoom(parseFloat((e.target as HTMLInputElement).value))}
                  className="w-full accent-primary"
                />
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

            {/* Match controls — only when live */}
            {isLive && (
              <div className="space-y-3">
                {/* Timer control */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                      <Clock size={14} /> Maç Saati
                    </h4>
                    {timerRunning && matchStartTime && (
                      <span className="font-mono font-bold text-primary text-sm">{formatElapsed(elapsed)}</span>
                    )}
                  </div>
                  {!timerRunning ? (
                    <button onClick={startTimer}
                      className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-1.5">
                      <Play size={14} /> Maç Başladı
                    </button>
                  ) : (
                    <button onClick={stopTimer}
                      className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition-all flex items-center justify-center gap-1.5">
                      <Pause size={14} /> Süreyi Durdur
                    </button>
                  )}
                </div>

                {/* Half-time toggle */}
                <button
                  onClick={toggleHalfTime}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isHalfTime ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'}`}
                >
                  {isHalfTime ? '▶ Devreye Devam Et' : '⏸ Devre Arası'}
                </button>

                {/* Score controls */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-gray-900 text-sm mb-4 text-center">Skor Kontrolü</h3>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center flex-1">
                      <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: homeColor }} />
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
                    <div className="text-center flex-1">
                      <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: awayColor }} />
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
