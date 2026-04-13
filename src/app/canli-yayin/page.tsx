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
}

export default function CanliYayin() {
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null)
  const [scores, setScores] = useState<Scores>({ home: 0, away: 0 })
  const [showIntro, setShowIntro] = useState(false)
  const [introFading, setIntroFading] = useState(false)
  const [muted, setMuted] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  // ICE candidates that arrive before setRemoteDescription is called
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([])
  const remoteDescSet = useRef(false)
  const introTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const socket = io({ transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('live-status', ({ isLive: live, matchInfo: mi, scores: sc }: any) => {
      setLoading(false)
      if (live) {
        setIsLive(true)
        setMatchInfo(mi)
        setScores(sc || { home: 0, away: 0 })
        socket.emit('join-viewer')
      } else {
        setIsLive(false)
      }
    })

    socket.on('match-updated', (mi: MatchInfo) => {
      setMatchInfo(mi)
    })

    socket.on('score-updated', (sc: Scores) => {
      setScores(sc)
    })

    socket.on('broadcast-ended', () => {
      setIsLive(false)
      setMatchInfo(null)
      setScores({ home: 0, away: 0 })
      setShowIntro(false)
      introTimers.current.forEach(clearTimeout)
      introTimers.current = []
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }
      iceCandidateQueue.current = []
      remoteDescSet.current = false
      if (videoRef.current) videoRef.current.srcObject = null
    })

    socket.on('room-not-found', () => {
      setIsLive(false)
      setLoading(false)
    })

    // WebRTC: receive offer from broadcaster
    socket.on('offer', async ({ senderId, offer }: any) => {
      // Close any previous connection cleanly before creating a new one
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }
      iceCandidateQueue.current = []
      remoteDescSet.current = false

      const pc = new RTCPeerConnection(ICE_SERVERS)
      pcRef.current = pc

      pc.ontrack = (e) => {
        if (videoRef.current && e.streams[0]) {
          videoRef.current.srcObject = e.streams[0]
          // Explicitly call play() — some browsers don't auto-play even with autoPlay attr
          videoRef.current.play().catch(() => {
            // Will play once user interacts (muted so usually fine)
          })
          // Reset and show intro
          introTimers.current.forEach(clearTimeout)
          introTimers.current = []
          setIntroFading(false)
          setShowIntro(true)
          const t1 = setTimeout(() => setIntroFading(true), 4000)
          const t2 = setTimeout(() => setShowIntro(false), 5000)
          introTimers.current = [t1, t2]
        }
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', { targetId: senderId, candidate: e.candidate })
        }
      }

      // Auto-restart ICE if connection fails (handles network hiccups)
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          pc.restartIce()
        }
      }

      try {
        await pc.setRemoteDescription(offer)
        remoteDescSet.current = true

        // Flush any ICE candidates that arrived before setRemoteDescription
        for (const queued of iceCandidateQueue.current) {
          await pc.addIceCandidate(queued).catch(() => {})
        }
        iceCandidateQueue.current = []

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('answer', { targetId: senderId, answer })
      } catch (err) {
        console.error('Answer error:', err)
      }
    })

    socket.on('ice-candidate', async ({ candidate }: any) => {
      if (!candidate) return
      if (pcRef.current && remoteDescSet.current) {
        // Remote description is set — add candidate directly
        await pcRef.current.addIceCandidate(candidate).catch(() => {})
      } else {
        // Queue for later — connection not ready yet
        iceCandidateQueue.current.push(candidate)
      }
    })

    return () => {
      socket.disconnect()
      pcRef.current?.close()
      introTimers.current.forEach(clearTimeout)
    }
  }, [])

  // Track fullscreen state changes (including browser back button / ESC key)
  useEffect(() => {
    function onFsChange() {
      const fsEl =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      setIsFullscreen(!!fsEl)
      if (!fsEl) {
        try { (screen.orientation as any)?.unlock?.() } catch {}
      }
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
          // iOS Safari fallback — auto-handles landscape orientation
          ;(videoRef.current as any).webkitEnterFullscreen()
          return
        }
        // Lock to landscape on mobile after entering fullscreen
        try {
          await (screen.orientation as any)?.lock?.('landscape')
        } catch {}
      } catch (err) {
        console.error('Fullscreen error:', err)
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          ;(document as any).webkitExitFullscreen()
        }
      } catch (err) {
        console.error('Exit fullscreen error:', err)
      }
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

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gray-950 flex flex-col relative overflow-hidden"
      style={{ width: '100%', height: isFullscreen ? '100vh' : undefined }}
    >
      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        muted={muted}
        playsInline
        className="w-full h-screen object-cover absolute inset-0"
      />

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 backdrop-blur-sm transition-all"
          title={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>

        {/* Mute button */}
        <button
          onClick={toggleMute}
          className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 backdrop-blur-sm transition-all"
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* LIVE badge */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        CANLI
      </div>

      {/* ── 5-second intro overlay ── */}
      {showIntro && matchInfo && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.92) 0%, rgba(10,20,60,0.92) 100%)',
            opacity: introFading ? 0 : 1,
            transition: introFading ? 'opacity 1s ease-out' : 'none',
          }}
        >
          {/* Branch / category */}
          {(matchInfo.branch || matchInfo.category) && (
            <div className="text-secondary/80 text-xs font-semibold tracking-[0.3em] uppercase mb-8">
              {matchInfo.branch}{matchInfo.category ? ` • ${matchInfo.category}` : ''}
            </div>
          )}

          {/* Teams row */}
          <div className="flex items-center gap-8 md:gap-16">
            {/* Home */}
            <div className="flex flex-col items-center gap-3 animate-intro-left">
              {matchInfo.homeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={matchInfo.homeLogo} alt="" className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-xl" />
              ) : (
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/10 flex items-center justify-center text-white/30 text-3xl font-black">
                  {matchInfo.homeTeam?.[0] || '?'}
                </div>
              )}
              <span className="text-white font-black text-lg md:text-2xl text-center max-w-[140px] leading-tight drop-shadow-lg">
                {matchInfo.homeTeam}
              </span>
            </div>

            {/* VS */}
            <div className="text-center">
              <div className="text-white/30 text-2xl font-black tracking-widest">VS</div>
            </div>

            {/* Away */}
            <div className="flex flex-col items-center gap-3 animate-intro-right">
              {matchInfo.awayLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={matchInfo.awayLogo} alt="" className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-xl" />
              ) : (
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/10 flex items-center justify-center text-white/30 text-3xl font-black">
                  {matchInfo.awayTeam?.[0] || '?'}
                </div>
              )}
              <span className="text-white font-black text-lg md:text-2xl text-center max-w-[140px] leading-tight drop-shadow-lg">
                {matchInfo.awayTeam}
              </span>
            </div>
          </div>

          {/* Venue */}
          {matchInfo.venue && (
            <div className="mt-10 text-white/40 text-xs tracking-widest uppercase">
              {matchInfo.venue}
            </div>
          )}

          {/* Club name */}
          <div className="mt-12 text-white/20 text-xs font-semibold tracking-[0.4em] uppercase">
            EUGSK
          </div>
        </div>
      )}

      {/* ── Persistent Scoreboard ── */}
      {matchInfo && (
        <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-center pb-4 px-4">
          <div
            className="flex items-center gap-3 md:gap-6 px-4 md:px-8 py-3 rounded-2xl shadow-2xl"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Home team */}
            <div className="flex items-center gap-2 min-w-0">
              {matchInfo.homeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={matchInfo.homeLogo} alt="" className="w-7 h-7 object-contain shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded bg-white/10 shrink-0" />
              )}
              <span className="text-white font-bold text-sm hidden sm:block truncate max-w-[100px]">
                {matchInfo.homeTeam}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white font-black text-2xl md:text-3xl tabular-nums w-8 text-center">{scores.home}</span>
              <span className="text-white/30 font-black text-xl">-</span>
              <span className="text-white font-black text-2xl md:text-3xl tabular-nums w-8 text-center">{scores.away}</span>
            </div>

            {/* Away team */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white font-bold text-sm hidden sm:block truncate max-w-[100px]">
                {matchInfo.awayTeam}
              </span>
              {matchInfo.awayLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={matchInfo.awayLogo} alt="" className="w-7 h-7 object-contain shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded bg-white/10 shrink-0" />
              )}
            </div>

            {/* Branch badge */}
            {matchInfo.branch && (
              <div className="hidden md:block text-white/40 text-xs border-l border-white/10 pl-4 ml-2">
                {matchInfo.branch}{matchInfo.category ? ` • ${matchInfo.category}` : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
