import app from '@adonisjs/core/services/app'
import server from '@adonisjs/core/services/server'
import { Secret } from '@adonisjs/core/helpers'
import { Server } from 'socket.io'
import User from '#models/user'
import { setSocketServer, channelRoom, userRoom } from '#services/socket'

// spustenie socket.io servera - posiela udalosti
// http server je pripraveny az ked sa aplikacia uplne spusti, preto pouzijeme app.ready
app.ready(() => {
  const nodeServer = server.getNodeServer()
  if (!nodeServer) return

  const io = new Server(nodeServer, {
    // povolime pripojenie z frontendu
    cors: { origin: true },
  })
  setSocketServer(io)

  // pred pripojenim overime token prihlaseneho pouzivatela (rovnaky ako pri API)
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Chyba prihlasovaci token'))
      }

      // overenie tokenu v tabulke auth_access_tokens
      const accessToken = await User.accessTokens.verify(new Secret(token))
      if (!accessToken) {
        return next(new Error('Neplatny prihlasovaci token'))
      }

      const user = await User.find(Number(accessToken.tokenableId))
      if (!user) {
        return next(new Error('Pouzivatel neexistuje'))
      }

      // pouzivatela si ulozime k socketu, aby sme vedeli, kto je pripojeny
      socket.data.user = user
      next()
    } catch {
      next(new Error('Nepodarilo sa overit prihlasenie'))
    }
  })

  // novy pripojeny pouzivatel
  io.on('connection', async (socket) => {
    const user: User = socket.data.user

    // osobna miestnost pouzivatela - tu posielame udalosti iba pre neho (napr. pozvanka)
    socket.join(userRoom(user.id))

    // miestnosti vsetkych kanalov, v ktorych je clenom - tu prichadzaju nove spravy
    const channels = await user.related('channels').query()
    for (const channel of channels) {
      socket.join(channelRoom(channel.id))
    }

    // pouzivatel prave pise spravu - rozpisany text posleme ostatnym clenom kanala
    socket.on('typing', (data) => {
      const room = channelRoom(data.channelId)

      // posielat moze iba clen kanala
      if (!socket.rooms.has(room)) return

      // socket.to(...) posle udalost vsetkym v miestnosti okrem odosielatela
      socket.to(room).emit('typing', {
        channelId: data.channelId,
        nickname: user.nickname,
        text: data.text,
      })
    })
  })
})
