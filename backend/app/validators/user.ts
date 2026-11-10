import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */
// email ukladame malymi pismenami, aby Test@x.sk a test@x.sk bol ten isty email
const email = () => vine.string().trim().toLowerCase().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.create({
  // meno a priezvisko su povinne
  firstName: vine.string().trim().minLength(1).maxLength(100),
  lastName: vine.string().trim().minLength(1).maxLength(100),
  // prezyvka musi byt unikatna a moze obsahovat iba pismena bez diakritiky, cisla a _
  // ukladame ju malymi pismenami
  nickname: vine
    .string()
    .trim()
    .toLowerCase()
    .minLength(1)
    .maxLength(50)
    .regex(/^[a-z0-9_]+$/)
    .unique({ table: 'users', column: 'nickname' }),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  // email alebo prezyvka (nickname) - prihlasit sa da oboma
  login: vine.string().trim().toLowerCase().minLength(1),
  password: vine.string(),
})
