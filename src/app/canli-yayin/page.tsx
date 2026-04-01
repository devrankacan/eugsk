'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { Volume2, VolumeX } from 'lucide-react'

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

interface KJEvent {
  type: string
  title: string
  subtitle?: string
  team?: 'home' | 'away' | null
  icon?: string
  duration?: number
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatTimer(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${pad(s)}`
}

export default function CanliYayin() {
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null)
  const [scores, setScores] = useState<Scores>({ home: 0, away: 0 })
  const [showIntro, setShowIntro] = useState(false)
  const [introFading, setIntroFading] = useState(false)
  const [muted, setMuted] = useState(true)
  const [isHalfTime, setIsHalfTime] = useState(false)
  const [homeColor, setHomeColor] = useState('#1e3a8a')
  const [awayColor, setAwayColor] = useState('#7f1d1d')
  const [matchStartTime, setMatchStartTime] = useState<number | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [currentKJ, setCurrentKJ] = useState<KJEvent | null>(null)
  const [kjVisible, setKjVisible] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const kjTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const kjFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer tick
  useEffect(() => {
    if (timerRunning && matchStartTime) {
      timerIntervalRef.current = setInterval(() => {
        setElapsed(Date.now() - matchStartTime)
      }, 500)
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [timerRunning, matchStartTime])

  const showKJ = useCallback((kj: KJEvent) => {
    if (kjTimerRef.current) clearTimeout(kjTimerRef.current)
    if (kjFadeRef.current) clearTimeout(kjFadeRef.current)
    setCurrentKJ(kj)
    setKjVisible(true)
    const dur = kj.duration || 5500
    kjFadeRef.current = setTimeout(() => setKjVisible(false), dur - 600)
    kjTimerRef.current = setTimeout(() => setCurrentKJ(null), dur)
  }, [])

  useEffect(() => {
    const socket = io({ transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('live-status', ({ isLive: live, matchInfo: mi, scores: sc, isHalfTime: ht, homeColor: hc, awayColor: ac, matchStartTime: mst, timerRunning: tr }: any) => {
      setLoading(false)
      if (live) {
        setIsLive(true)
        setMatchInfo(mi)
        setScores(sc || { home: 0, away: 0 })
        setIsHalfTime(ht || false)
        if (hc) setHomeColor(hc)
        if (ac) setAwayColor(ac)
        if (mst) setMatchStartTime(mst)
        setTimerRunning(tr || false)
        socket.emit('join-viewer')
      } else {
        setIsLive(false)
      }
    })

    socket.on('match-updated', (mi: MatchInfo) => setMatchInfo(mi))
    socket.on('score-updated', (sc: Scores) => setScores(sc))
    socket.on('colors-updated', ({ homeColor: hc, awayColor: ac }: any) => {
      setHomeColor(hc)
      setAwayColor(ac)
    })
    socket.on('half-time-updated', (ht: boolean) => setIsHalfTime(ht))
    socket.on('timer-updated', ({ matchStartTime: mst, timerRunning: tr }: any) => {
      setMatchStartTime(mst)
      setTimerRunning(tr)
      if (mst) setElapsed(Date.now() - mst)
    })
    socket.on('kj-event', (kj: KJEvent) => showKJ(kj))

    socket.on('broadcast-ended', () => {
      setIsLive(false)
      setMatchInfo(null)
      setScores({ home: 0, away: 0 })
      setShowIntro(false)
      setIsHalfTime(false)
      setTimerRunning(false)
      setMatchStartTime(null)
      setCurrentKJ(null)
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
      if (videoRef.current) videoRef.current.srcObject = null
    })

    socket.on('room-not-found', () => { setIsLive(false); setLoading(false) })

    socket.on('offer', async ({ senderId, offer }: any) => {
      const pc = new RTCPeerConnection(ICE_SERVERS)
      pcRef.current = pc
      pc.ontrack = (e) => {
        if (videoRef.current && e.streams[0]) {
          videoRef.current.srcObject = e.streams[0]
          setShowIntro(true)
          setIntroFading(false)
          setTimeout(() => setIntroFading(true), 4000)
          setTimeout(() => setShowIntro(false), 5000)
        }
      }
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('ice-candidate', { targetId: senderId, candidate: e.candidate })
      }
      try {
        await pc.setRemoteDescription(offer)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('answer', { targetId: senderId, answer })
      } catch (err) {
        console.error('Answer error:', err)
      }
    })

    socket.on('ice-candidate', async ({ candidate }: any) => {
      try { await pcRef.current?.addIceCandidate(candidate) } catch {}
    })

    return () => {
      socket.disconnect()
      pcRef.current?.close()
      if (kjTimerRef.current) clearTimeout(kjTimerRef.current)
      if (kjFadeRef.current) clearTimeout(kjFadeRef.current)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [showKJ])

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setMuted(videoRef.current.muted)
    }
  }

  const branch = matchInfo?.branch?.toLowerCase() || ''
  const isFutbol = branch.includes('futbol') || branch.includes('football')
  const isVoleybol = branch.includes('voley') || branch.includes('volley')

  // Scoreboard position based on branch
  const scoreboardPosition = isFutbol
    ? 'top-16 left-4'
    : isVoleybol
    ? 'bottom-4 left-4'
    : 'bottom-4 left-0 right-0 px-4 flex justify-center'

  const scoreboardStyle = isFutbol || isVoleybol ? 'inline-flex' : 'flex'

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
    <div className="min-h-screen bg-gray-950 flex flex-col relative overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        muted={muted}
        playsInline
        className="w-full h-screen object-cover absolute inset-0"
      />

      {/* Mute button — bottom right */}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 z-30 bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 backdrop-blur-sm transition-all"
      >
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* CANLI badge — always top-right */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        CANLI
      </div>

      {/* ── Half-time overlay ── */}
      {isHalfTime && matchInfo && (
        <div className="absolute inset-0 z-25 flex flex-col items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}>
          <div className="text-center">
            <div className="text-secondary font-black text-xs tracking-[0.4em] uppercase mb-4">
              {matchInfo.branch || 'EUGSK'}
            </div>
            <div className="text-white font-black text-4xl md:text-6xl tracking-widest mb-2">
              DEVRE ARASI
            </div>
            <div className="w-24 h-0.5 bg-secondary/50 mx-auto my-6" />
            <div className="flex items-center gap-6 justify-center">
              <span className="text-white/80 font-bold text-lg">{matchInfo.homeTeam}</span>
              <div className="flex items-center gap-3">
                <span className="text-white font-black text-3xl tabular-nums">{scores.home}</span>
                <span className="text-white/30 font-black text-2xl">-</span>
                <span className="text-white font-black text-3xl tabular-nums">{scores.away}</span>
              </div>
              <span className="text-white/80 font-bold text-lg">{matchInfo.awayTeam}</span>
            </div>
            {matchInfo.venue && (
              <div className="mt-6 text-white/30 text-xs tracking-widest uppercase">{matchInfo.venue}</div>
            )}
          </div>
        </div>
      )}

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
          {(matchInfo.branch || matchInfo.category) && (
            <div className="text-secondary/80 text-xs font-semibold tracking-[0.3em] uppercase mb-8">
              {matchInfo.branch}{matchInfo.category ? ` • ${matchInfo.category}` : ''}
            </div>
          )}
          <div className="flex items-center gap-8 md:gap-16">
            <div className="flex flex-col items-center gap-3 animate-intro-left">
              {matchInfo.homeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={matchInfo.homeLogo} alt="" className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-xl" />
              ) : (
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center text-white font-black text-3xl"
                  style={{ backgroundColor: homeColor + '40', border: `3px solid ${homeColor}` }}>
                  {matchInfo.homeTeam?.[0] || '?'}
                </div>
              )}
              <span className="text-white font-black text-lg md:text-2xl text-center max-w-[140px] leading-tight drop-shadow-lg">
                {matchInfo.homeTeam}
              </span>
            </div>
            <div className="text-center">
              <div className="text-white/30 text-2xl font-black tracking-widest">VS</div>
            </div>
            <div className="flex flex-col items-center gap-3 animate-intro-right">
              {matchInfo.awayLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={matchInfo.awayLogo} alt="" className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-xl" />
              ) : (
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center text-white font-black text-3xl"
                  style={{ backgroundColor: awayColor + '40', border: `3px solid ${awayColor}` }}>
                  {matchInfo.awayTeam?.[0] || '?'}
                </div>
              )}
              <span className="text-white font-black text-lg md:text-2xl text-center max-w-[140px] leading-tight drop-shadow-lg">
                {matchInfo.awayTeam}
              </span>
            </div>
          </div>
          {matchInfo.venue && (
            <div className="mt-10 text-white/40 text-xs tracking-widest uppercase">{matchInfo.venue}</div>
          )}
          <div className="mt-12 text-white/20 text-xs font-semibold tracking-[0.4em] uppercase">EUGSK</div>
        </div>
      )}

      {/* ── Scoreboard (branch-positioned) ── */}
      {matchInfo && !isHalfTime && (
        <div className={`absolute z-30 ${scoreboardPosition}`}>
          <div
            className={`${scoreboardStyle} items-center gap-2 px-3 py-2 rounded-xl shadow-2xl`}
            style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Home team */}
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Team color strip */}
              <div className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: homeColor }} />
              {matchInfo.homeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={matchInfo.homeLogo} alt="" className="w-6 h-6 object-contain shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded shrink-0" style={{ backgroundColor: homeColor + '60' }} />
              )}
              <span className="text-white font-bold text-xs hidden sm:block truncate max-w-[80px]">
                {matchInfo.homeTeam}
              </span>
            </div>

            {/* Score + timer */}
            <div className="flex flex-col items-center shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-black text-xl tabular-nums w-6 text-center">{scores.home}</span>
                <span className="text-white/30 font-black text-base">-</span>
                <span className="text-white font-black text-xl tabular-nums w-6 text-center">{scores.away}</span>
              </div>
              {(isFutbol || isVoleybol) && timerRunning && matchStartTime && (
                <div className="text-secondary text-[10px] font-bold tabular-nums leading-none mt-0.5">
                  {isFutbol ? `${Math.floor(elapsed / 60000)}'` : formatTimer(elapsed)}
                </div>
              )}
            </div>

            {/* Away team */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-white font-bold text-xs hidden sm:block truncate max-w-[80px]">
                {matchInfo.awayTeam}
              </span>
              {matchInfo.awayLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={matchInfo.awayLogo} alt="" className="w-6 h-6 object-contain shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded shrink-0" style={{ backgroundColor: awayColor + '60' }} />
              )}
              <div className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: awayColor }} />
            </div>
          </div>
        </div>
      )}

      {/* ── KJ Event (lower-third) ── */}
      {currentKJ && (
        <div
          className="absolute bottom-16 left-4 z-30 max-w-xs"
          style={{
            opacity: kjVisible ? 1 : 0,
            transform: kjVisible ? 'translateX(0)' : 'translateX(-24px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          <div
            className="rounded-r-xl overflow-hidden shadow-2xl"
            style={{ borderLeft: `4px solid ${currentKJ.team === 'away' ? awayColor : homeColor}` }}
          >
            <div className="bg-black/85 backdrop-blur-sm px-4 py-2.5">
              <div className="flex items-center gap-2">
                {currentKJ.icon && <span className="text-lg leading-none">{currentKJ.icon}</span>}
                <span className="text-white font-black text-sm tracking-wide uppercase">{currentKJ.title}</span>
              </div>
              {currentKJ.subtitle && (
                <div className="text-white/60 text-xs mt-0.5 ml-0.5">{currentKJ.subtitle}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
