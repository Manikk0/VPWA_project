// registrovani pouzivatelia aplikacie
export const users = [
  { email: 'user@test.sk', password: '123', nick: '@moj_nick', name: 'Meno Pouzivatela' },
  { email: 'jozef@test.sk', password: '123', nick: '@jozef', name: 'Jozef Mrkvicka' },
  { email: 'ed@test.sk', password: '123', nick: '@ed', name: 'Ed Tester' },
]

// predvolene kanaly
export const channels = [
  {
    name: 'general',
    isPrivate: false,
    createdBy: '@moj_nick',
    description: 'Vseobecny kanal pre novinky a pokec.',
    members: [
      { name: '@moj_nick', role: 'admin' },
      { name: '@jozef', role: 'member' },
      { name: '@ed', role: 'member' },
    ],
  },
  {
    name: 'test1',
    isPrivate: true,
    createdBy: '@moj_nick',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    members: [
      { name: '@moj_nick', role: 'admin' },
      { name: '@ed', role: 'member' },
    ],
  },
  {
    name: 'test2',
    isPrivate: false,
    createdBy: '@jozef',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    members: [
      { name: '@jozef', role: 'admin' },
      { name: '@moj_nick', role: 'member' },
    ],
  },
]

// predvolene spravy pre jednotlive kanaly
export const messages = {
  general: [
    {
      user: '@ed',
      time: '12:30',
      text: 'Ahoj vsetci, toto je ukazkova sprava v kanali #general.',
    },
    {
      user: '@jozef',
      time: '12:32',
      text: 'Pozdravujem @moj_nick, pozri si novy dizajn!',
    },
    {
      user: '@moj_nick',
      time: '12:35',
      text: 'Super, vyzera to fajn a cisto.',
    },
  ],
  test1: [
    {
      user: '@ed',
      time: '10:15',
      text: 'Ahoj v sukromnom kanali test1.',
    },
  ],
  test2: [],
}
