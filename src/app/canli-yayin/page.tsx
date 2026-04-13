'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react'

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

interface Scores {
  home: number
  away: number
  homeSets?: number
  awaySets?: number
  homeRedCards?: number
  awayRedCards?: number
}

interface TimerState {
  running: boolean
  startedAt: number | null
  elapsed: number
  half: 1 | 2
  extraTime: number
}

interface MatchEvent {
  id: string
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'timeout'
  team: 'home' | 'away'
  player?: string
  playerOut?: string
  playerIn?: string
  minute?: number
}

function abbrev(name: string): string {
  return (name || '?????').slice(0, 5).toUpperCase()
}

function RedCards({ count }: { count?: number }) {
  if (!count || count <= 0) return null
  return (
    <span className="flex items-center gap-0.5 ml-1">
      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
        <span key={i} style={{ display: 'inline-block', width: 6, height: 9, background: '#ef4444', borderRadius: '1px', flexShrink: 0 }} />
      ))}
    </span>
  )
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

  // İlave süre bölgesinde mi?
  const normalMax = halfBase + halfCap
  if (totalMs > normalMax) {
    const capMin   = timer.half === 1 ? 45 : 90
    const extraSec = Math.floor((totalMs - normalMax) / 1000)
    const extraMin = Math.floor(extraSec / 60) + 1
    return `${capMin}+${extraMin}'`
  }

  const s = Math.floor(totalMs / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function UCLStar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10.5" stroke="#c9a227" strokeWidth="1.4" />
      <path d="M12 3.5l1.55 4.77h5.02l-4.06 2.95 1.55 4.77L12 13.04l-4.06 2.95 1.55-4.77L5.43 8.27h5.02z"
        fill="#c9a227" />
    </svg>
  )
}

const EVENT_META: Record<string, { icon: string; label: string; accent: string }> = {
  goal:         { icon: '⚽', label: 'GOL',           accent: '#22c55e' },
  yellow_card:  { icon: '🟨', label: 'SARI KART',     accent: '#eab308' },
  red_card:     { icon: '🟥', label: 'KIRMIZI KART',  accent: '#ef4444' },
  substitution: { icon: '🔄', label: 'DEĞİŞİKLİK',   accent: '#60a5fa' },
  timeout:      { icon: '⏸', label: 'MOLA',           accent: '#a78bfa' },
}

export default function CanliYayin() {
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null)
  const [scores, setScores] = useState<Scores>({ home: 0, away: 0 })
  const [showIntro, setShowIntro] = useState(false)
  const [introFading, setIntroFading] = useState(false)
  const [muted, setMuted] = useState(true)
  const [timerDisplay, setTimerDisplay] = useState('00:00')
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [eventsHistory, setEventsHistory] = useState<MatchEvent[]>([])
  const [showReminder, setShowReminder] = useState(false)
  const [reminderFading, setReminderFading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const timerRef = useRef<TimerState>({ running: false, startedAt: null, elapsed: 0, half: 1, extraTime: 0 })
  // ICE candidates that arrive before setRemoteDescription is called
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([])
  const remoteDescSet = useRef(false)
  const introTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const reminderTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Timer display — her 250ms yerel hesaplama
  useEffect(() => {
    const iv = setInterval(() => {
      setTimerDisplay(computeTimerDisplay(timerRef.current))
    }, 250)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const socket = io({ transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('live-status', ({ isLive: live, matchInfo: mi, scores: sc, timer: t }: any) => {
      setLoading(false)
      if (live) {
        setIsLive(true)
        setMatchInfo(mi)
        setScores(sc || { home: 0, away: 0 })
        if (t) timerRef.current = t
        socket.emit('join-viewer')
      } else {
        setIsLive(false)
      }
    })

    socket.on('match-updated', (mi: MatchInfo) => setMatchInfo(mi))
    socket.on('score-updated', (sc: Scores) => setScores(sc))
    socket.on('timer-updated', (t: TimerState) => { timerRef.current = t })

    socket.on('events-history', (history: MatchEvent[]) => {
      setEventsHistory(history)
    })

    socket.on('match-event', (event: MatchEvent) => {
      setEventsHistory(prev => [...prev, event])
      setEvents(prev => [...prev.slice(-2), event])
      setTimeout(() => setEvents(prev => prev.filter(e => e.id !== event.id)), 5500)
    })

    socket.on('broadcast-ended', () => {
      setIsLive(false)
      setMatchInfo(null)
      setScores({ home: 0, away: 0 })
      setShowIntro(false)
      setEvents([])
      setEventsHistory([])
      setShowReminder(false)
      introTimers.current.forEach(clearTimeout)
      introTimers.current = []
      reminderTimers.current.forEach(clearTimeout)
      reminderTimers.current = []
      timerRef.current = { running: false, startedAt: null, elapsed: 0, half: 1, extraTime: 0 }
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
      iceCandidateQueue.current = []
      remoteDescSet.current = false
      if (videoRef.current) videoRef.current.srcObject = null
    })

    socket.on('room-not-found', () => { setIsLive(false); setLoading(false) })

    // Admin panelinden tanıtım tetiklendiğinde
    socket.on('show-intro', () => {
      introTimers.current.forEach(clearTimeout)
      introTimers.current = []
      setIntroFading(false)
      setShowIntro(true)
      const t1 = setTimeout(() => setIntroFading(true), 4000)
      const t2 = setTimeout(() => setShowIntro(false), 5200)
      introTimers.current = [t1, t2]
    })

    // Admin panelinden skor hatırlatıcı tetiklendiğinde
    socket.on('show-score-reminder', () => {
      reminderTimers.current.forEach(clearTimeout)
      reminderTimers.current = []
      setReminderFading(false)
      setShowReminder(true)
      const t1 = setTimeout(() => setReminderFading(true), 5000)
      const t2 = setTimeout(() => setShowReminder(false), 5700)
      reminderTimers.current = [t1, t2]
    })

    // WebRTC: receive offer from broadcaster
    socket.on('offer', async ({ senderId, offer }: any) => {
      // Eski bağlantıyı temizle
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
      iceCandidateQueue.current = []
      remoteDescSet.current = false

      const pc = new RTCPeerConnection(ICE_SERVERS)
      pcRef.current = pc

      pc.ontrack = (e) => {
        if (videoRef.current && e.streams[0]) {
          videoRef.current.srcObject = e.streams[0]
          // Bazı tarayıcılar autoPlay attribute'una rağmen oynatmıyor — açıkça play() çağır
          videoRef.current.play().catch(() => {})
        }
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('ice-candidate', { targetId: senderId, candidate: e.candidate })
      }

      // Bağlantı başarısız olursa otomatik yeniden dene
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') pc.restartIce()
      }

      try {
        await pc.setRemoteDescription(offer)
        remoteDescSet.current = true

        // setRemoteDescription'dan önce gelen ICE candidate'leri işle
        for (const queued of iceCandidateQueue.current) {
          await pc.addIceCandidate(queued).catch(() => {})
        }
        iceCandidateQueue.current = []

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('answer', { targetId: senderId, answer })
      } catch (err) { console.error('Answer error:', err) }
    })

    socket.on('ice-candidate', async ({ candidate }: any) => {
      if (!candidate) return
      if (pcRef.current && remoteDescSet.current) {
        await pcRef.current.addIceCandidate(candidate).catch(() => {})
      } else {
        // Bağlantı henüz hazır değil — sıraya al
        iceCandidateQueue.current.push(candidate)
      }
    })

    return () => {
      socket.disconnect()
      pcRef.current?.close()
      introTimers.current.forEach(clearTimeout)
      reminderTimers.current.forEach(clearTimeout)
    }
  }, [])

  // Tam ekran durum takibi (ESC / geri tuşu dahil)
  useEffect(() => {
    function onFsChange() {
      const fsEl = document.fullscreenElement || (document as any).webkitFullscreenElement
      setIsFullscreen(!!fsEl)
      if (!fsEl) { try { (screen.orientation as any)?.unlock?.() } catch {} }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange)
    }
  }, [])

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setMuted(videoRef.current.muted)
    }
  }

  async function toggleFullscreen() {
    if (!isFullscreen) {
      const el = containerRef.current
      try {
        if (el?.requestFullscreen) {
          await el.requestFullscreen()
        } else if ((el as any)?.webkitRequestFullscreen) {
          ;(el as any).webkitRequestFullscreen()
        } else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
          // iOS Safari — kendi içinde landscape halleder
          ;(videoRef.current as any).webkitEnterFullscreen()
          return
        }
        // Mobilde yatay kilitle
        try { await (screen.orientation as any)?.lock?.('landscape') } catch {}
      } catch (err) { console.error('Fullscreen error:', err) }
    } else {
      try {
        if (document.exitFullscreen) await document.exitFullscreen()
        else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen()
      } catch (err) { console.error('Exit fullscreen error:', err) }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-white/50">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!isLive) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📺</span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">Canlı Yayın Yok</h1>
          <p className="text-white/40 text-sm">Şu an aktif bir yayın bulunmuyor.</p>
          <p className="text-white/25 text-xs mt-2">Maç başladığında bu sayfa otomatik yenilenir.</p>
        </div>
      </div>
    )
  }

  const branch = (matchInfo?.branch || '').toLowerCase()
  const isFutbol = branch.includes('futbol') || branch.includes('football') || branch.includes('soccer')
  const isVoleybol = branch.includes('voleybol') || branch.includes('volleyball')

  // Skor Hatırlatıcı için olay özetleri
  const homeGoals    = eventsHistory.filter(e => e.type === 'goal'        && e.team === 'home')
  const awayGoals    = eventsHistory.filter(e => e.type === 'goal'        && e.team === 'away')
  const homeYellows  = eventsHistory.filter(e => e.type === 'yellow_card' && e.team === 'home')
  const homeReds     = eventsHistory.filter(e => e.type === 'red_card'    && e.team === 'home')
  const awayYellows  = eventsHistory.filter(e => e.type === 'yellow_card' && e.team === 'away')
  const awayReds     = eventsHistory.filter(e => e.type === 'red_card'    && e.team === 'away')

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-950 flex flex-col relative overflow-hidden">
      {/* Video */}
      <video ref={videoRef} autoPlay muted={muted} playsInline
        className="w-full h-screen object-cover absolute inset-0" />

      {/* Sağ üst kontroller */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        {/* Tam ekran butonu */}
        <button
          onClick={toggleFullscreen}
          className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 backdrop-blur-sm transition-all"
          title={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
        {/* Ses butonu */}
        <button onClick={toggleMute}
          className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 backdrop-blur-sm transition-all">
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* CANLI rozeti — mute/fullscreen butonlarının solunda */}
      <div className="absolute top-4 right-28 z-30 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-lg">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        CANLI
      </div>

      {/* ══════════════════════════════════════════
          MAÇ BAŞI TANITIM OVERLAY (admin tetikler)
          ══════════════════════════════════════════ */}
      {showIntro && matchInfo && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.6)',
            opacity: introFading ? 0 : 1,
            transition: introFading ? 'opacity 1.2s ease-in-out' : 'opacity 0.5s ease-in',
          }}
        >
          {/* Panel — ekranın ~82%'si */}
          <div
            className="relative flex flex-col items-center justify-center overflow-hidden w-[82%] h-[78%]"
            style={{
              background: 'linear-gradient(135deg, #0d1b8e 0%, #071260 45%, #060c3d 100%)',
              borderRadius: '6px',
              boxShadow: '0 0 0 1px rgba(201,162,39,0.25), 0 40px 100px rgba(0,0,0,0.95)',
            }}
          >
            {/* Arka plan ışık efektleri */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `
                radial-gradient(ellipse 55% 60% at 20% 55%, rgba(13,27,142,0.6) 0%, transparent 70%),
                radial-gradient(ellipse 55% 60% at 80% 55%, rgba(13,27,142,0.6) 0%, transparent 70%),
                radial-gradient(ellipse 30% 40% at 50% 40%, rgba(201,162,39,0.08) 0%, transparent 70%)
              `
            }} />

            {/* Branş / kategori */}
            {(matchInfo.branch || matchInfo.category) && (
              <div className="text-secondary/70 text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase mb-6 z-10">
                {matchInfo.branch}{matchInfo.category ? ` • ${matchInfo.category}` : ''}
              </div>
            )}

            {/* Takımlar + merkez logo */}
            <div className="flex items-center gap-6 md:gap-16 z-10">

              {/* Ev sahibi */}
              <div className="flex flex-col items-center gap-3 md:gap-4 animate-intro-left">
                <div
                  className="w-20 h-20 md:w-32 md:h-32 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.15)' }}
                >
                  {matchInfo.homeLogo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={matchInfo.homeLogo} alt="" className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-2xl" />
                    : <span className="text-white/30 text-3xl md:text-5xl font-black">{matchInfo.homeTeam?.[0] || '?'}</span>
                  }
                </div>
                <span className="text-white font-black text-sm md:text-xl text-center max-w-[120px] md:max-w-[160px] leading-tight drop-shadow-lg">
                  {matchInfo.homeTeam}
                </span>
              </div>

              {/* Merkez: EUGSK amblemi */}
              <div className="flex flex-col items-center gap-2 z-10">
                <div
                  className="w-12 h-12 md:w-18 md:h-18 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(201,162,39,0.12)',
                    border: '2px solid rgba(201,162,39,0.45)',
                    width: '3.5rem', height: '3.5rem',
                  }}
                >
                  <span className="text-secondary font-black text-[9px] tracking-wider text-center leading-tight px-1">
                    EUGSK
                  </span>
                </div>
              </div>

              {/* Deplasman */}
              <div className="flex flex-col items-center gap-3 md:gap-4 animate-intro-right">
                <div
                  className="w-20 h-20 md:w-32 md:h-32 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.15)' }}
                >
                  {matchInfo.awayLogo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={matchInfo.awayLogo} alt="" className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-2xl" />
                    : <span className="text-white/30 text-3xl md:text-5xl font-black">{matchInfo.awayTeam?.[0] || '?'}</span>
                  }
                </div>
                <span className="text-white font-black text-sm md:text-xl text-center max-w-[120px] md:max-w-[160px] leading-tight drop-shadow-lg">
                  {matchInfo.awayTeam}
                </span>
              </div>
            </div>

            {/* Saha */}
            {matchInfo.venue && (
              <div className="mt-6 md:mt-10 text-white/45 text-xs md:text-sm font-semibold tracking-[0.25em] uppercase z-10">
                {matchInfo.venue}
              </div>
            )}

            {/* Alt altın çizgi */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[3px]"
              style={{ background: 'linear-gradient(90deg, transparent 0%, #c9a227 30%, #c9a227 70%, transparent 100%)' }}
            />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          KJ SCOREBOARD — SOL ÜST KÖŞE
          + OLAY BİLDİRİMLERİ (hemen altında)
          ════════════════════════════════════════════ */}
      {matchInfo && (
        <div className="absolute top-4 left-4 z-30 flex flex-col gap-1.5">

          {/* ── UCL / FUTBOL SKORBORDU ── */}
          {isFutbol && (
            <div className="animate-cev-slide-in flex items-stretch overflow-hidden"
              style={{
                borderRadius: '2px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.85), 0 0 0 1px rgba(201,162,39,0.18)',
              }}>

              {/* UCL yıldız + kronometre */}
              <div className="flex items-center gap-2 px-3 py-2.5"
                style={{ background: '#001344' }}>
                <UCLStar />
                <span className="font-black tabular-nums text-[13px] tracking-wider"
                  style={{ color: '#c9a227', minWidth: '3.5rem', fontVariantNumeric: 'tabular-nums' }}>
                  {timerDisplay}
                </span>
              </div>

              <div style={{ width: '1px', background: 'rgba(201,162,39,0.25)' }} />

              {/* Ev sahibi */}
              <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: '#001344' }}>
                {matchInfo.homeLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={matchInfo.homeLogo} alt="" style={{ width: 15, height: 15, objectFit: 'contain' }} />
                )}
                <span className="text-white font-black tracking-[0.12em]" style={{ fontSize: '13px' }}>
                  {abbrev(matchInfo.homeTeam)}
                </span>
                <RedCards count={scores.homeRedCards} />
              </div>

              {/* Skor */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ background: '#071d4f' }}>
                <span className="text-white font-black tabular-nums" style={{ fontSize: '1.1rem', lineHeight: 1 }}>
                  {scores.home}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.22)', fontWeight: 900, fontSize: '0.85rem' }}>|</span>
                <span className="text-white font-black tabular-nums" style={{ fontSize: '1.1rem', lineHeight: 1 }}>
                  {scores.away}
                </span>
              </div>

              {/* Deplasman */}
              <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: '#001344' }}>
                <RedCards count={scores.awayRedCards} />
                <span className="text-white font-black tracking-[0.12em]" style={{ fontSize: '13px' }}>
                  {abbrev(matchInfo.awayTeam)}
                </span>
                {matchInfo.awayLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={matchInfo.awayLogo} alt="" style={{ width: 15, height: 15, objectFit: 'contain' }} />
                )}
              </div>

              {/* Altın şerit */}
              <div style={{ width: '3px', background: 'linear-gradient(180deg,#c9a227 0%,#7a5e0e 100%)' }} />
            </div>
          )}

          {/* ── VNL / VOLEYBOL SKORBORDU ── */}
          {isVoleybol && (
            <div className="animate-cev-slide-in overflow-hidden"
              style={{ borderRadius: '2px', minWidth: '174px', boxShadow: '0 4px 24px rgba(0,0,0,0.85)' }}>

              {/* Kırmızı başlık şeridi */}
              <div className="flex items-center justify-between px-2.5 py-[3px]" style={{ background: '#c41230' }}>
                <span style={{ color: 'white', fontWeight: 900, fontSize: '9px', letterSpacing: '0.3em' }}>VNL</span>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '8px', fontWeight: 700, letterSpacing: '0.12em' }}>
                  {(matchInfo.category || matchInfo.branch || '').toUpperCase().slice(0, 12)}
                </span>
              </div>

              {/* Ev sahibi satırı */}
              <div className="flex items-stretch" style={{ background: 'rgba(4,6,20,0.93)' }}>
                <div className="flex items-center gap-1.5 px-2.5 py-[7px] flex-1 min-w-0">
                  {matchInfo.homeLogo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={matchInfo.homeLogo} alt="" style={{ width: 13, height: 13, objectFit: 'contain', flexShrink: 0 }} />
                  )}
                  <span className="text-white font-black tracking-[0.1em]" style={{ fontSize: '12px' }}>
                    {abbrev(matchInfo.homeTeam)}
                  </span>
                  <RedCards count={scores.homeRedCards} />
                </div>
                <div className="flex items-center justify-center font-black text-white"
                  style={{ background: '#1b3d82', minWidth: '2.25rem', fontSize: '1rem', lineHeight: 1, padding: '0 8px' }}>
                  {scores.homeSets ?? 0}
                </div>
                <div className="flex items-center justify-center font-black text-white"
                  style={{ background: 'rgba(255,255,255,0.06)', minWidth: '2.25rem', fontSize: '1rem', lineHeight: 1, padding: '0 8px', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                  {scores.home}
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.055)' }} />

              {/* Deplasman satırı */}
              <div className="flex items-stretch" style={{ background: 'rgba(4,6,20,0.93)' }}>
                <div className="flex items-center gap-1.5 px-2.5 py-[7px] flex-1 min-w-0">
                  {matchInfo.awayLogo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={matchInfo.awayLogo} alt="" style={{ width: 13, height: 13, objectFit: 'contain', flexShrink: 0 }} />
                  )}
                  <span className="text-white font-black tracking-[0.1em]" style={{ fontSize: '12px' }}>
                    {abbrev(matchInfo.awayTeam)}
                  </span>
                  <RedCards count={scores.awayRedCards} />
                </div>
                <div className="flex items-center justify-center font-black text-white"
                  style={{ background: '#1b3d82', minWidth: '2.25rem', fontSize: '1rem', lineHeight: 1, padding: '0 8px' }}>
                  {scores.awaySets ?? 0}
                </div>
                <div className="flex items-center justify-center font-black text-white"
                  style={{ background: 'rgba(255,255,255,0.06)', minWidth: '2.25rem', fontSize: '1rem', lineHeight: 1, padding: '0 8px', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                  {scores.away}
                </div>
              </div>
            </div>
          )}

          {/* ── DEFAULT SKORBORDU (diğer branşlar) ── */}
          {!isFutbol && !isVoleybol && (
            <div className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderRadius: '2px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 min-w-0">
                {matchInfo.homeLogo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={matchInfo.homeLogo} alt="" className="w-6 h-6 object-contain shrink-0" />
                  : <div className="w-6 h-6 rounded bg-white/10 shrink-0" />}
                <span className="text-white font-bold text-xs hidden sm:block truncate max-w-[80px]">{matchInfo.homeTeam}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-white font-black text-lg tabular-nums w-6 text-center">{scores.home}</span>
                <span className="text-white/30 font-black">-</span>
                <span className="text-white font-black text-lg tabular-nums w-6 text-center">{scores.away}</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-white font-bold text-xs hidden sm:block truncate max-w-[80px]">{matchInfo.awayTeam}</span>
                {matchInfo.awayLogo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={matchInfo.awayLogo} alt="" className="w-6 h-6 object-contain shrink-0" />
                  : <div className="w-6 h-6 rounded bg-white/10 shrink-0" />}
              </div>
            </div>
          )}

          {/* ── OLAY BİLDİRİMLERİ — skorboardın altından dropdown açılır ── */}
          <div className="flex flex-col gap-1">
            {events.map(event => {
              const meta = EVENT_META[event.type] || EVENT_META.goal
              const teamName = event.team === 'home' ? matchInfo.homeTeam : matchInfo.awayTeam
              const bg = isFutbol ? '#001344' : isVoleybol ? 'rgba(4,6,20,0.93)' : 'rgba(0,0,0,0.82)'
              return (
                <div key={event.id}
                  className="animate-action-drop flex items-center gap-2.5 overflow-hidden"
                  style={{
                    borderRadius: '2px',
                    background: bg,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
                    borderLeft: `3px solid ${meta.accent}`,
                    padding: '6px 10px 6px 8px',
                    minWidth: '160px',
                  }}>
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>{meta.icon}</span>
                  <div className="flex flex-col leading-none gap-0.5">
                    <span className="text-white font-black tracking-[0.15em] uppercase" style={{ fontSize: '10px' }}>
                      {meta.label}{event.minute ? ` ${event.minute}'` : ''}
                    </span>
                    {(event.player || event.playerOut) && (
                      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '9px', fontWeight: 600 }}>
                        {event.type === 'substitution'
                          ? `${event.playerOut ?? ''} → ${event.playerIn ?? ''}`
                          : `${event.player ?? ''}  ·  ${abbrev(teamName)}`}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          SKOR HATIRLATICI — ALT LOWER THIRD (admin tetikler)
          ═══════════════════════════════════════════════════ */}
      {showReminder && matchInfo && (
        <div
          className="absolute bottom-0 left-0 right-0 z-40"
          style={{
            transform: reminderFading ? 'translateY(105%)' : 'translateY(0)',
            transition: reminderFading
              ? 'transform 0.55s cubic-bezier(0.55, 0, 1, 0.45)'
              : 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Kronometre pill — barın hemen üstünde */}
          <div className="flex justify-center">
            <div style={{
              background: '#001344',
              border: '1px solid rgba(201,162,39,0.4)',
              borderBottom: 'none',
              padding: '3px 18px',
              borderRadius: '5px 5px 0 0',
              color: '#c9a227',
              fontWeight: 900,
              fontSize: '11px',
              letterSpacing: '0.25em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {timerDisplay}
            </div>
          </div>

          {/* Üst altın şerit */}
          <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #c9a227 15%, #c9a227 85%, transparent)' }} />

          {/* Ana bar */}
          <div className="flex items-center" style={{ background: '#001344', padding: '10px 20px', minHeight: '76px' }}>

            {/* Ev sahibi */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {matchInfo.homeLogo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={matchInfo.homeLogo} alt="" style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }} />
                : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
              }
              <div className="min-w-0">
                <div className="text-white font-black text-sm md:text-base truncate">{matchInfo.homeTeam}</div>
                {homeGoals.length > 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', fontWeight: 600, marginTop: 2 }}>
                    ⚽ {homeGoals.map(e => [e.player, e.minute ? `${e.minute}'` : ''].filter(Boolean).join(' ')).filter(Boolean).join('  ·  ')}
                  </div>
                )}
                {(homeYellows.length > 0 || homeReds.length > 0) && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {homeYellows.slice(0, 4).map((_, i) => (
                      <span key={i} style={{ display: 'inline-block', width: 5, height: 7, background: '#eab308', borderRadius: '1px' }} />
                    ))}
                    {homeReds.slice(0, 2).map((_, i) => (
                      <span key={`r${i}`} style={{ display: 'inline-block', width: 5, height: 7, background: '#ef4444', borderRadius: '1px', marginLeft: homeYellows.length > 0 ? 3 : 0 }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Skor merkezi */}
            <div className="flex items-center gap-2 md:gap-4 shrink-0 px-4 md:px-10">
              <span className="text-white font-black tabular-nums" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', lineHeight: 1 }}>
                {scores.home}
              </span>
              <span style={{ color: 'rgba(201,162,39,0.45)', fontWeight: 900, fontSize: '1.3rem' }}>—</span>
              <span className="text-white font-black tabular-nums" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', lineHeight: 1 }}>
                {scores.away}
              </span>
            </div>

            {/* Deplasman */}
            <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
              <div className="min-w-0 text-right">
                <div className="text-white font-black text-sm md:text-base truncate">{matchInfo.awayTeam}</div>
                {awayGoals.length > 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', fontWeight: 600, marginTop: 2 }}>
                    {awayGoals.map(e => [e.player, e.minute ? `${e.minute}'` : ''].filter(Boolean).join(' ')).filter(Boolean).join('  ·  ')} ⚽
                  </div>
                )}
                {(awayYellows.length > 0 || awayReds.length > 0) && (
                  <div className="flex items-center gap-0.5 mt-1 justify-end">
                    {awayYellows.slice(0, 4).map((_, i) => (
                      <span key={i} style={{ display: 'inline-block', width: 5, height: 7, background: '#eab308', borderRadius: '1px' }} />
                    ))}
                    {awayReds.slice(0, 2).map((_, i) => (
                      <span key={`r${i}`} style={{ display: 'inline-block', width: 5, height: 7, background: '#ef4444', borderRadius: '1px', marginLeft: awayYellows.length > 0 ? 3 : 0 }} />
                    ))}
                  </div>
                )}
              </div>
              {matchInfo.awayLogo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={matchInfo.awayLogo} alt="" style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }} />
                : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
              }
            </div>
          </div>

          {/* Alt altın şerit */}
          <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #c9a227 15%, #c9a227 85%, transparent)' }} />
        </div>
      )}
    </div>
  )
}
