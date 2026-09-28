export const HOSTELS = ['SH-1', 'SH-2', 'SH-3', 'Mayflower', 'Faculty Housing']

export const LAUNDRY_DAYS = {
  'SH-1': [1, 3, 5],
  'SH-2': [2, 4, 6],
  'SH-3': [0, 2, 4],
  Mayflower: [1, 3, 5],
  'Faculty Housing': [1, 3, 5],
}

export const RULES = [
  'Laundry will be open from 4pm to 8pm throughout the week.',
  'SH-1: Monday, Wednesday, Friday\nSH-2: Tuesday, Thursday, Saturday\nSH-3: Tuesday, Thursday, Sunday\nMayflower: Monday, Wednesday, Friday\nFaculty Housing: Monday, Wednesday, Friday',
  'Only one bag containing 8 clothes can be submitted on one day.',
  'Bedsheets can only be submitted on the 1st and 15th of all months.',
  'If your Bedsheet submission date and day don’t align, please submit it on the 1st and 15th regardless.',
  'The history will be auto deleted at the end of every month',
  'Need help? Contact 0000000000',
]

export const REGULAR_ITEMS = [
  'Shirts/T-shirts/Sweatshirts',
  'Jeans/ Lowers',
  'Towels/ Napkins',
  'Bedsheets',
  'Pillowcase',
]

export const EXTRA_ITEMS = [
  { name: 'Blankets', price: 300 },
  { name: 'Comforter', price: 200 },
  { name: 'Jacket', price: 150 },
  { name: 'Dry cleaning', price: 300 },
  { name: 'Shoes', price: 350 },
]

export const ISSUE_TYPES = ['stain', 'torn', 'faded']

export const SH2_FLOORS = [2, 3, 4, 5, 6, 7, 8]
export const SH1_WINGS = ['A Wing', 'B Wing', 'C Wing', 'D Wing']
export const SH1_FLOORS = [1, 2, 3, 4]

export function weekday() {
  return new Date().getDay()
}

export function nextLaundryLabel(hostel) {
  const days = LAUNDRY_DAYS[hostel] || []
  const today = weekday()
  if (days.includes(today)) return { today: true, text: 'Today · 4–8pm' }
  for (let i = 1; i <= 7; i += 1) {
    const d = (today + i) % 7
    if (days.includes(d)) return { today: false, text: dayName(d) }
  }
  return { today: false, text: '' }
}

export function dayName(d = weekday()) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]
}

export function hostelsForToday(d = weekday()) {
  return HOSTELS.filter((h) => LAUNDRY_DAYS[h].includes(d))
}

export function isLaundryDay(hostel, d = weekday()) {
  return (LAUNDRY_DAYS[hostel] || []).includes(d)
}

export function isBedsheetDay(date = new Date()) {
  const n = date.getDate()
  return n === 1 || n === 15
}

export function sameMonth(ts, date = new Date()) {
  const t = new Date(ts)
  return t.getFullYear() === date.getFullYear() && t.getMonth() === date.getMonth()
}

export function isToday(ts, date = new Date()) {
  const t = new Date(ts)
  return t.getFullYear() === date.getFullYear() && t.getMonth() === date.getMonth() && t.getDate() === date.getDate()
}

export function parseRoom(room) {
  const m = String(room || '').trim().toUpperCase().match(/(\d+)\s*([XY])/)
  if (!m) return { num: 0, side: 'X', floor: 0, label: String(room || '') }
  const num = Number(m[1])
  return { num, side: m[2], floor: Math.floor(num / 100), label: `${num} ${m[2]}` }
}

export function roomsOnFloor(floor) {
  const start = floor * 100 + 1
  const end = floor * 100 + 36
  const list = []
  for (let n = start; n <= end; n += 1) list.push(n)
  return list
}

export function qtyTotal(items) {
  return Object.values(items || {}).reduce((s, it) => s + (Number(it.qty) || 0), 0)
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function initial(name) {
  const ch = String(name || '').trim().charAt(0)
  return ch ? ch.toUpperCase() : '?'
}
