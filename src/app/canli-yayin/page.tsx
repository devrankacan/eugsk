'use client'

import { useEffect, useRef, useState } from 'react'
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

export default function CanliYayin() {
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null)
  const [scores, setScores] = useState<Scores>({ home: 0, away: 0 })
  const [showIntro, setShowIntro] = useState(false)
  const [introFading, setIntroFading] = useState(false)
  const [muted, setMuted] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)

  useEffect(() => {
    const socket = io({ transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('live-status', ({ isLive: live, matchInfo: mi, scores: sc }: any) => {
      setLoading(false)
      if (live) {
        setIsLive(true)
        setMatchInfo(mi)
        setScores(sc || { home: 0, away: 0 })
        // join as viewer
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
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }
      if (videoRef.current) videoRef.current.srcObject = null
    })

    socket.on('room-not-found', () => {
      setIsLive(false)
      setLoading(false)
    })

    // WebRTC: receive offer from broadcaster
    socket.on('offer', async ({ senderId, offer }: any) => {
      const pc = new RTCPeerConnection(ICE_SERVERS)
      pcRef.current = pc

      pc.ontrack = (e) => {
        if (videoRef.current && e.streams[0]) {
          videoRef.current.srcObject = e.streams[0]
          // show intro when stream starts
          setShowIntro(true)
          setTimeout(() => setIntroFading(true), 4000)
          setTimeout(() => setShowIntro(false), 5000)
        }
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', { targetId: senderId, candidate: e.candidate })
        }
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
      try {
        await pcRef.current?.addIceCandidate(candidate)
      } catch (err) {
        console.error('ICE error:', err)
      }
    })

    return () => {
      socket.disconnect()
      pcRef.current?.close()
    }
  }, [])

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setMuted(videoRef.current.muted)
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
    <div className="min-h-screen bg-gray-950 flex flex-col relative overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        muted={muted}
        playsInline
        className="w-full h-screen object-cover absolute inset-0"
      />

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-30 bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 backdrop-blur-sm transition-all"
      >
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

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

      {/* ── Persistent Scoreboard (branch-aware KJ) ── */}
      {matchInfo && (() => {
        const branch = (matchInfo.branch || '').toLowerCase()
        const isFutbol = branch.includes('futbol') || branch.includes('football') || branch.includes('soccer')
        const isVoleybol = branch.includes('voleybol') || branch.includes('volleyball') || branch.includes('volley')

        /* ── UCL / Futbol Stili ── */
        if (isFutbol) {
          return (
            <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-center pb-5 px-4 animate-kj-enter">
              <div
                className="relative flex items-stretch overflow-hidden shadow-2xl"
                style={{
                  borderRadius: '6px',
                  border: '1px solid rgba(201,162,39,0.35)',
                  background: 'rgba(0,12,40,0.82)',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                  boxShadow: '0 0 0 1px rgba(201,162,39,0.12), 0 20px 60px rgba(0,0,0,0.7)',
                  minWidth: 'min(640px, 96vw)',
                }}
              >
                {/* Altın üst çizgi */}
                <div className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(201,162,39,0.8) 20%, rgba(201,162,39,1) 50%, rgba(201,162,39,0.8) 80%, transparent 100%)' }} />

                {/* Ev sahibi */}
                <div className="flex items-center gap-3 px-5 py-3 flex-1 min-w-0">
                  {matchInfo.homeLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={matchInfo.homeLogo} alt="" className="w-9 h-9 object-contain shrink-0 drop-shadow-lg" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/10 shrink-0" />
                  )}
                  <span className="text-white font-bold text-sm md:text-base tracking-wide truncate hidden sm:block"
                    style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)', letterSpacing: '0.04em' }}>
                    {matchInfo.homeTeam}
                  </span>
                </div>

                {/* Skor merkez */}
                <div className="flex items-center shrink-0"
                  style={{ background: 'rgba(0,18,51,0.7)', borderLeft: '1px solid rgba(201,162,39,0.2)', borderRight: '1px solid rgba(201,162,39,0.2)' }}>
                  <div className="flex flex-col items-center px-6 py-2">
                    {matchInfo.branch && (
                      <span className="text-[10px] font-semibold tracking-[0.25em] uppercase mb-1"
                        style={{ color: 'rgba(201,162,39,0.75)' }}>
                        {matchInfo.branch}{matchInfo.category ? ` · ${matchInfo.category}` : ''}
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-white font-black tabular-nums"
                        style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', textShadow: '0 0 20px rgba(201,162,39,0.4)' }}>
                        {scores.home}
                      </span>
                      <span style={{ color: 'rgba(201,162,39,0.5)', fontWeight: 900, fontSize: '1.1rem' }}>:</span>
                      <span className="text-white font-black tabular-nums"
                        style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', textShadow: '0 0 20px rgba(201,162,39,0.4)' }}>
                        {scores.away}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deplasman */}
                <div className="flex items-center gap-3 px-5 py-3 flex-1 min-w-0 justify-end">
                  <span className="text-white font-bold text-sm md:text-base tracking-wide truncate hidden sm:block"
                    style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)', letterSpacing: '0.04em' }}>
                    {matchInfo.awayTeam}
                  </span>
                  {matchInfo.awayLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={matchInfo.awayLogo} alt="" className="w-9 h-9 object-contain shrink-0 drop-shadow-lg" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/10 shrink-0" />
                  )}
                </div>

                {/* Alt lacivert gölge çizgisi */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px]"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)' }} />
              </div>
            </div>
          )
        }

        /* ── CEV / Voleybol Stili ── */
        if (isVoleybol) {
          return (
            <div className="absolute bottom-0 left-0 right-0 z-30 pb-4 px-4 flex justify-center animate-cev-slide-in">
              <div className="flex items-stretch overflow-hidden shadow-2xl"
                style={{ borderRadius: '4px', minWidth: 'min(620px, 96vw)' }}>

                {/* Sol şerit - Ev sahibi */}
                <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0"
                  style={{ background: 'rgba(15,15,15,0.92)', borderRight: '2px solid rgba(220,38,38,0.8)' }}>
                  {matchInfo.homeLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={matchInfo.homeLogo} alt="" className="w-8 h-8 object-contain shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-white/10 shrink-0" />
                  )}
                  <span className="text-white font-black text-sm md:text-base uppercase tracking-widest truncate hidden sm:block">
                    {matchInfo.homeTeam}
                  </span>
                </div>

                {/* Merkez set kutusu */}
                <div className="flex items-center shrink-0"
                  style={{ background: 'rgba(220,38,38,0.93)' }}>
                  <div className="flex flex-col items-center px-1">
                    {/* SET etiketi */}
                    <div className="flex items-center gap-1 px-3 pt-1 pb-0.5">
                      <span className="text-white/70 text-[9px] font-bold tracking-[0.3em] uppercase">SET</span>
                    </div>
                    {/* Skor kutucukları */}
                    <div className="flex items-center gap-1 px-3 pb-2">
                      <div className="flex flex-col items-center justify-center rounded"
                        style={{ background: 'rgba(0,0,0,0.35)', minWidth: '2.2rem', padding: '2px 8px' }}>
                        <span className="text-white font-black tabular-nums leading-none"
                          style={{ fontSize: 'clamp(1.4rem,2.8vw,1.9rem)' }}>
                          {scores.home}
                        </span>
                      </div>
                      <span className="text-white/50 font-black text-base">-</span>
                      <div className="flex flex-col items-center justify-center rounded"
                        style={{ background: 'rgba(0,0,0,0.35)', minWidth: '2.2rem', padding: '2px 8px' }}>
                        <span className="text-white font-black tabular-nums leading-none"
                          style={{ fontSize: 'clamp(1.4rem,2.8vw,1.9rem)' }}>
                          {scores.away}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sağ şerit - Deplasman */}
                <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0 justify-end"
                  style={{ background: 'rgba(15,15,15,0.92)', borderLeft: '2px solid rgba(220,38,38,0.8)' }}>
                  <span className="text-white font-black text-sm md:text-base uppercase tracking-widest truncate hidden sm:block">
                    {matchInfo.awayTeam}
                  </span>
                  {matchInfo.awayLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={matchInfo.awayLogo} alt="" className="w-8 h-8 object-contain shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-white/10 shrink-0" />
                  )}
                </div>

                {/* Kategori etiketi sağda */}
                {matchInfo.category && (
                  <div className="flex items-center px-3 shrink-0"
                    style={{ background: 'rgba(220,38,38,0.75)' }}>
                    <span className="text-white/80 text-[10px] font-bold tracking-[0.2em] uppercase"
                      style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
                      {matchInfo.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        }

        /* ── Default Stili (Futbol/Voleybol dışı branşlar) ── */
        return (
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
        )
      })()}
    </div>
  )
}
