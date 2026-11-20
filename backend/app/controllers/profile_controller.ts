import UserTransformer from '#transformers/user_transformer'
import type { HttpContext } from '@adonisjs/core/http'
import { statusValidator, notificationsValidator } from '#validators/user'
import {
  notifyChannelChanged,
  addUserToChannelRoom,
  removeUserFromChannelRoom,
} from '#services/socket'

export default class ProfileController {
  async show({ auth, serialize }: HttpContext) {
    return serialize(UserTransformer.transform(auth.getUserOrFail()))
  }

  // zmena stavu prihlaseneho pouzivatela (online, dnd, offline)
  async updateStatus({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    // overime, ze novy stav je jedna z povolenych hodnot
    const { status } = await request.validateUsing(statusValidator)

    // ulozime novy stav do databazy
    user.status = status
    await user.save()

    // clenovia vsetkych kanalov pouzivatela hned uvidia jeho novy stav, frontend si po udalosti channels:changed znova nacita zoznam kanalov
    const channels = await user.related('channels').query()
    for (const channel of channels) {
      notifyChannelChanged(channel.id)

      if (status === 'offline') {
        // offline pouzivatelovi neposielame spravy - jeho okna odpojime z miestnosti kanala
        removeUserFromChannelRoom(user.id, channel.id)
      } else {
        // po prepnuti do online (alebo dnd) mu spravy z kanala znova prichadzaju
        addUserToChannelRoom(user.id, channel.id)
      }
    }

    return serialize(UserTransformer.transform(user))
  }

  // zmena nastavenia notifikacii prihlaseneho pouzivatela
  async updateNotifications({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    // overime, ze prisla hodnota true alebo false
    const { onlyMentions } = await request.validateUsing(notificationsValidator)

    // v databaze je nastavenie ulozene ako text: 'mentions_only' alebo 'all'
    if (onlyMentions) {
      user.notificationPref = 'mentions_only'
    } else {
      user.notificationPref = 'all'
    }
    await user.save()

    return serialize(UserTransformer.transform(user))
  }
}
