// registrovani pouzivatelia aplikacie
// status moze byt 'Online', 'DND' alebo 'Offline'
export const users = [
  {
    email: 'user@test.sk',
    password: '123',
    nick: 'juro',
    name: 'Juraj Metlicka',
    status: 'Online',
  },
  {
    email: 'jozef@test.sk',
    password: '123',
    nick: 'jozef',
    name: 'Jozef Mrkvicka',
    status: 'Online',
  },
  { email: 'ed@test.sk', password: '123', nick: 'ed', name: 'Ed Tester', status: 'DND' },
  {
    email: 'mara@test.sk',
    password: '123',
    nick: 'mara',
    name: 'Maria Kovacova',
    status: 'Online',
  },
  { email: 'peto@test.sk', password: '123', nick: 'peto', name: 'Peter Novak', status: 'Offline' },
  {
    email: 'zuzka@test.sk',
    password: '123',
    nick: 'zuzka',
    name: 'Zuzana Hraskova',
    status: 'Online',
  },
]

// predvolene kanaly
export const channels = [
  {
    name: 'general',
    isPrivate: false,
    createdBy: 'juro',
    description: 'Vseobecny kanal pre novinky a pokec.',
    members: [
      { name: 'juro', role: 'admin' },
      { name: 'jozef', role: 'member' },
      { name: 'ed', role: 'member' },
      { name: 'mara', role: 'member' },
    ],
  },
  {
    name: 'test1',
    isPrivate: true,
    createdBy: 'juro',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    members: [
      { name: 'juro', role: 'admin' },
      { name: 'ed', role: 'member' },
    ],
  },
  {
    name: 'test2',
    isPrivate: false,
    createdBy: 'jozef',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    members: [
      { name: 'jozef', role: 'admin' },
      { name: 'juro', role: 'member' },
    ],
  },
  {
    name: 'programovanie',
    isPrivate: false,
    createdBy: 'ed',
    description: 'Debaty o kode, chybach a skole.',
    members: [
      { name: 'ed', role: 'admin' },
      { name: 'mara', role: 'member' },
      { name: 'peto', role: 'member' },
    ],
  },
  {
    name: 'tajne',
    isPrivate: true,
    createdBy: 'mara',
    description: 'Sukromny kanal len pre pozvanych.',
    members: [
      { name: 'mara', role: 'admin' },
      { name: 'zuzka', role: 'member' },
    ],
  },
  {
    name: 'random',
    isPrivate: false,
    createdBy: 'peto',
    description: 'Hocico, co sa nehodi inam.',
    members: [
      { name: 'peto', role: 'admin' },
      { name: 'juro', role: 'member' },
      { name: 'jozef', role: 'member' },
      { name: 'zuzka', role: 'member' },
    ],
  },
]

// predvolene spravy pre jednotlive kanaly
export const messages = {
  general: [
    {
      user: 'ed',
      time: '12:30',
      text: 'Ahoj vsetci, toto je ukazkova sprava v kanali #general.',
    },
    {
      user: 'jozef',
      time: '12:32',
      text: 'Pozdravujem @juro, pozri si novy dizajn!',
    },
    {
      user: 'juro',
      time: '12:35',
      text: 'Super, vyzera to fajn a cisto.',
    },
  ],
  test1: [
    {
      user: 'ed',
      time: '10:15',
      text: 'Ahoj v sukromnom kanali test1.',
    },
  ],
  test2: [],
  programovanie: [
    { user: 'ed', time: '09:00', text: 'Rano som opravil bug v logine.' },
    { user: 'mara', time: '09:05', text: '@ed super, pozriem sa na to po obede.' },
    { user: 'peto', time: '09:10', text: 'Ma niekto skusenosti s Quasarom?' },
  ],
  tajne: [{ user: 'mara', time: '18:20', text: 'Ahoj @zuzka, toto je nas sukromny kanal.' }],
  random: [
    { user: 'peto', time: '14:00', text: 'Ide niekto na obed?' },
    { user: 'zuzka', time: '14:02', text: 'Ja idem, @peto pockaj ma.' },
    { user: 'jozef', time: '14:03', text: 'Ja dnes nestiham.' },
  ],
}
