const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname: '0.0.0.0', port })
const handle = app.getRequestHandler()

// In-memory live state
let liveRoom = null

function getRoomStatus() {
  if (!liveRoom) return { isLive: false }
  return {
    isLive: true,
    matchInfo: liveRoom.matchInfo,
    scores: liveRoom.scores,
    isHalfTime: liveRoom.isHalfTime,
    homeColor: liveRoom.homeColor,
    awayColor: liveRoom.awayColor,
    matchStartTime: liveRoom.matchStartTime,
    timerRunning: liveRoom.timerRunning,
  }
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      await handle(req, res, parse(req.url, true))
    } catch (err) {
      console.error('Request error:', err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  })

  io.on('connection', (socket) => {
    // Send current live status immediately on connect
    socket.emit('live-status', getRoomStatus())

    // ── BROADCASTER ──────────────────────────────────────
    socket.on('start-broadcast', ({ matchInfo }) => {
      liveRoom = {
        broadcasterId: socket.id,
        viewers: new Map(),
        matchInfo: matchInfo || {},
        scores: { home: 0, away: 0 },
        isHalfTime: false,
        homeColor: '#1e3a8a',
        awayColor: '#7f1d1d',
        matchStartTime: null,
        timerRunning: false,
      }
      socket.isBroadcaster = true
      socket.join('live')
      console.log('▶ Broadcast started')
      io.emit('live-status', getRoomStatus())
    })

    socket.on('update-match', (matchInfo) => {
      if (!liveRoom || liveRoom.broadcasterId !== socket.id) return
      liveRoom.matchInfo = matchInfo
      io.to('live').emit('match-updated', matchInfo)
    })

    socket.on('update-score', (scores) => {
      if (!liveRoom || liveRoom.broadcasterId !== socket.id) return
      liveRoom.scores = scores
      io.to('live').emit('score-updated', scores)
    })

    socket.on('update-colors', ({ homeColor, awayColor }) => {
      if (!liveRoom || liveRoom.broadcasterId !== socket.id) return
      liveRoom.homeColor = homeColor
      liveRoom.awayColor = awayColor
      io.to('live').emit('colors-updated', { homeColor, awayColor })
    })

    socket.on('toggle-half-time', (isHalfTime) => {
      if (!liveRoom || liveRoom.broadcasterId !== socket.id) return
      liveRoom.isHalfTime = isHalfTime
      io.to('live').emit('half-time-updated', isHalfTime)
    })

    socket.on('send-kj', (kjEvent) => {
      if (!liveRoom || liveRoom.broadcasterId !== socket.id) return
      io.to('live').emit('kj-event', kjEvent)
    })

    socket.on('start-timer', () => {
      if (!liveRoom || liveRoom.broadcasterId !== socket.id) return
      liveRoom.matchStartTime = Date.now()
      liveRoom.timerRunning = true
      io.to('live').emit('timer-updated', { matchStartTime: liveRoom.matchStartTime, timerRunning: true })
    })

    socket.on('stop-timer', () => {
      if (!liveRoom || liveRoom.broadcasterId !== socket.id) return
      liveRoom.timerRunning = false
      io.to('live').emit('timer-updated', { matchStartTime: liveRoom.matchStartTime, timerRunning: false })
    })

    socket.on('stop-broadcast', () => {
      if (!liveRoom || liveRoom.broadcasterId !== socket.id) return
      console.log('⏹ Broadcast stopped')
      io.emit('broadcast-ended')
      liveRoom = null
    })

    // ── VIEWER ───────────────────────────────────────────
    socket.on('join-viewer', () => {
      if (!liveRoom) { socket.emit('room-not-found'); return }
      socket.join('live')
      liveRoom.viewers.set(socket.id, true)
      socket.emit('match-updated', liveRoom.matchInfo)
      socket.emit('score-updated', liveRoom.scores)
      socket.emit('colors-updated', { homeColor: liveRoom.homeColor, awayColor: liveRoom.awayColor })
      socket.emit('half-time-updated', liveRoom.isHalfTime)
      socket.emit('timer-updated', { matchStartTime: liveRoom.matchStartTime, timerRunning: liveRoom.timerRunning })
      io.to(liveRoom.broadcasterId).emit('viewer-joined', { viewerId: socket.id })
      io.to(liveRoom.broadcasterId).emit('viewer-count', liveRoom.viewers.size)
    })

    // ── WebRTC SIGNALING ─────────────────────────────────
    socket.on('offer', ({ targetId, offer }) => {
      io.to(targetId).emit('offer', { senderId: socket.id, offer })
    })
    socket.on('answer', ({ targetId, answer }) => {
      io.to(targetId).emit('answer', { senderId: socket.id, answer })
    })
    socket.on('ice-candidate', ({ targetId, candidate }) => {
      io.to(targetId).emit('ice-candidate', { senderId: socket.id, candidate })
    })

    // ── DISCONNECT ───────────────────────────────────────
    socket.on('disconnect', () => {
      if (!liveRoom) return
      if (liveRoom.broadcasterId === socket.id) {
        console.log('⚠ Broadcaster disconnected')
        io.emit('broadcast-ended')
        liveRoom = null
      } else if (liveRoom.viewers.has(socket.id)) {
        liveRoom.viewers.delete(socket.id)
        if (liveRoom) {
          io.to(liveRoom.broadcasterId).emit('viewer-count', liveRoom.viewers.size)
        }
      }
    })
  })

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`> Ready on http://0.0.0.0:${port}`)
  })
})
