// DOCASNE: zoznam pouzivatelov z prototypu
// po prihlaseni sa udaje prihlaseneho pouzivatela aktualizuju zo servera
// status moze byt 'Online', 'DND' alebo 'Offline'
// onlyMentions = true znamena, ze pouzivatel chce notifikacie iba pre spravy s jeho @nick
export const users = [
  {
    nick: 'juro',
    name: 'Juraj Metlicka',
    status: 'Online',
    onlyMentions: false,
  },
  {
    nick: 'jozef',
    name: 'Jozef Mrkvicka',
    status: 'Online',
    onlyMentions: false,
  },
  {
    nick: 'ed',
    name: 'Ed Tester',
    status: 'DND',
    onlyMentions: false,
  },
  {
    nick: 'mara',
    name: 'Maria Kovacova',
    status: 'Online',
    onlyMentions: true,
  },
  {
    nick: 'peto',
    name: 'Peter Novak',
    status: 'Offline',
    onlyMentions: false,
  },
  {
    nick: 'zuzka',
    name: 'Zuzana Hraskova',
    status: 'Online',
    onlyMentions: false,
  },
]
