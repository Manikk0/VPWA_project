import vine from '@vinejs/vine'

// kontrola novej spravy - text nesmie byt prazdny ani prilis dlhy
export const createMessageValidator = vine.create({
  content: vine.string().trim().minLength(1).maxLength(2000),
})
