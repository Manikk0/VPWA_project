/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    // kanaly prihlaseneho pouzivatela
    router
      .group(() => {
        router.get('/', [controllers.Channels, 'index'])
        router.post('/join', [controllers.Channels, 'join'])
        // id v adrese musi byt cislo
        router
          .post('/:id/leave', [controllers.Channels, 'leave'])
          .where('id', router.matchers.number())
        router.delete('/:id', [controllers.Channels, 'destroy']).where('id', router.matchers.number())
        router
          .post('/:id/kick', [controllers.Channels, 'kick'])
          .where('id', router.matchers.number())

        // spravy kanala - nacitanie (po davkach) a odoslanie novej spravy
        router
          .get('/:id/messages', [controllers.Messages, 'index'])
          .where('id', router.matchers.number())
        router
          .post('/:id/messages', [controllers.Messages, 'store'])
          .where('id', router.matchers.number())
      })
      .prefix('channels')
      .as('channels')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
