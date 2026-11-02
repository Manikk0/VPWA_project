import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class NewAccountController {
  async store({ request, serialize }: HttpContext) {
    // overenie udajov z registracneho formulara
    const { firstName, lastName, nickname, email, password } =
      await request.validateUsing(signupValidator)

    // vytvorenie pouzivatela
    const user = await User.create({ firstName, lastName, nickname, email, password })
    // nacitame pouzivatela znova z databazy, aby mal aj predvolene hodnoty (status, notificationPref)
    await user.refresh()
    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
