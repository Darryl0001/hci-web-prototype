export const fields = [
  'Model', 'Storage', 'Asking price', 'Battery health', 'Network lock',
  'Listed condition', 'Screen condition', 'Warranty', 'Repairs', 'Known defects',
  'Inclusions', 'Location',
] as const

export type Field = typeof fields[number]
type Source = 'Buyer entry' | 'Demo data' | 'Sample screenshot' | 'Seller, via chat'
export type CustomDetail = { name: string; value: string }
export type Listing = {
  values: Partial<Record<Field, string>>
  sources: Partial<Record<Field, Source>>
  custom: CustomDetail[]
  image?: string
  shorthand?: boolean
  confirmed: boolean
}

export const options: Partial<Record<Field, string[]>> = {
  Model: ['iPhone 13', 'iPhone 14', 'iPhone 12', 'iPhone 11', 'iPhone 15', 'iPhone 13 Pro'],
  Storage: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'],
  'Network lock': ['Factory unlocked', 'Carrier locked', 'GPP / SIM interposer'],
}

export const requiredFields: Field[] = ['Model', 'Storage', 'Asking price']
const amount = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 })
export const pesos = (value: number) => `₱${amount.format(value)}`
export const asset = (filename: string) => `${import.meta.env.BASE_URL}assets/${filename}`
export const emptyListing = (): Listing => ({ values: {}, sources: {}, custom: [], confirmed: true })
export const valueOf = (listing: Listing, field: Field) => listing.values[field] || 'Unknown'
export const sourceOf = (listing: Listing, field: Field) => valueOf(listing, field) === 'Unknown'
  ? 'Not supplied'
  : listing.sources[field] ?? 'Buyer entry'
export const priceOf = (listing: Listing) => Number(listing.values['Asking price'] || 0)
export const listingTitle = (listing: Listing) => `${valueOf(listing, 'Model')} · ${valueOf(listing, 'Storage')}`

export function displayValue(listing: Listing, field: Field) {
  const value = valueOf(listing, field)
  if (value === 'Unknown') return value
  if (field === 'Asking price') return pesos(priceOf(listing))
  if (field === 'Battery health') return `${value}%`
  return value
}

export function withDetail(listing: Listing, field: Field, value: string, source: Source = 'Buyer entry'): Listing {
  return { ...listing, values: { ...listing.values, [field]: value }, sources: { ...listing.sources, [field]: source } }
}

export function cleanValue(field: Field, raw: string) {
  if (field === 'Asking price') return raw.replace(/[₱,\s]/g, '')
  if (field === 'Battery health') return raw.trim().replace(/\s*%$/, '')
  return raw.trim()
}

export function fieldError(field: Field, value: string, required = false) {
  if (field === 'Asking price' && (required || value) &&
    (!/^\+?(?:\d+\.?\d*|\.\d+)$/.test(value) || !Number.isFinite(Number(value)) || Number(value) <= 0)) {
    return 'Enter a price greater than zero'
  }
  if (required && !value) return `Choose ${field.toLowerCase()}`
  if (field === 'Battery health' && value && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 100)) {
    return 'Enter a whole percentage from 1 to 100'
  }
  return ''
}

function fixture(values: Listing['values'], source: Source): Listing {
  const sources = Object.fromEntries(Object.keys(values).map(field => [field, source]))
  return { ...emptyListing(), values, sources }
}

export function uploadDemo(image?: string) {
  return {
    ...fixture({ Model: 'iPhone 13', Storage: '128 GB', 'Asking price': '24500', 'Battery health': '87',
      'Listed condition': 'Good condition', 'Network lock': 'Factory unlocked' }, 'Demo data'),
    image,
  }
}

export function screenshotDemo(shorthand = false): Listing {
  return {
    ...fixture({ Model: 'iPhone 13', Storage: '128 GB', 'Asking price': '22000',
      'Network lock': 'Factory unlocked', 'Listed condition': 'Used, good condition', Location: 'Quezon City' }, 'Sample screenshot'),
    image: asset(shorthand ? 'sample_shorthand.png' : 'sample_listing.png'),
    shorthand, confirmed: !shorthand,
  }
}

export function batteryDemo(battery: number) {
  const listing = withDetail(uploadDemo(), 'Storage', '256 GB', 'Demo data')
  return withDetail(listing, 'Battery health', String(battery), 'Demo data')
}

type Comparable = { price: number; location: string; age: number; battery: string; model: string; storage: string }
type Sample = [price: number, location: string, age: number, battery: string]
const rows = (samples: Sample[], model = 'iPhone 13', storage = '128 GB'): Comparable[] =>
  samples.map(([price, location, age, battery]) => ({ price, location, age, battery, model, storage }))

const comparables = [
  ...rows([
    [18000, 'Manila', 3, '81%'], [19000, 'Pasig', 5, 'Unknown'], [20000, 'Quezon City', 2, '85%'],
    [20000, 'Makati', 8, '82%'], [21000, 'Cebu City', 4, '91%'], [22000, 'Taguig', 6, '86%'],
    [22000, 'Manila', 1, '87%'], [23000, 'Pasig', 9, '92%'], [24000, 'Makati', 7, '88%'],
    [24000, 'Quezon City', 2, '89%'], [25000, 'Davao City', 10, '89%'], [26000, 'Cebu City', 5, '100%'],
  ]),
  ...rows([[27000, 'Manila', 2, '88%'], [28000, 'Pasig', 4, '90%'], [29000, 'Makati', 6, '94%']], 'iPhone 14'),
  ...rows([
    [25000, 'Manila', 3, '90%'], [25500, 'Pasig', 5, '91%'], [26000, 'Quezon City', 2, '92%'],
    [26000, 'Makati', 8, '94%'], [26500, 'Cebu City', 4, '94%'], [27000, 'Taguig', 6, '96%'],
    [27500, 'Davao City', 7, '98%'], [28000, 'Cebu City', 5, '100%'],
    [18000, 'Manila', 4, '72%'], [18500, 'Pasig', 7, '73%'], [19000, 'Quezon City', 3, '74%'],
    [19500, 'Makati', 6, '75%'], [20000, 'Cebu City', 5, '76%'], [20500, 'Taguig', 2, '77%'],
    [21000, 'Davao City', 8, '78%'], [21500, 'Manila', 6, '79%'], [22000, 'Pasig', 4, '79%'],
  ], 'iPhone 13', '256 GB'),
]

export const minimumMatches = 8
export const recencyDays = 28

function percentile(prices: number[], fraction: number) {
  const index = (prices.length - 1) * fraction
  const low = Math.floor(index)
  return prices[low] + (prices[Math.ceil(index)] - prices[low]) * (index - low)
}

function batteryBand(battery: number) {
  if (!(battery >= 1 && battery <= 100)) return ''
  if (battery < 80) return 'battery health below 80%'
  if (battery < 90) return 'battery health from 80% to 89%'
  return 'battery health of 90% or higher'
}

export function evaluate(listing: Listing) {
  const exact = comparables.filter(row => row.model === valueOf(listing, 'Model') &&
    row.storage === valueOf(listing, 'Storage') && row.age <= recencyDays)
  const band = batteryBand(Number(listing.values['Battery health']))
  const closer = band ? exact.filter(row => batteryBand(parseInt(row.battery, 10)) === band) : []
  const conditionMatched = closer.length >= minimumMatches && closer.length < exact.length
  const matches = conditionMatched ? closer : exact
  const enough = matches.length >= minimumMatches
  const prices = matches.map(row => row.price).sort((a, b) => a - b)
  const low = enough ? Math.round(percentile(prices, .25)) : 0
  const high = enough ? Math.round(percentile(prices, .75)) : 0
  const median = enough ? percentile(prices, .5) : 0
  const asking = priceOf(listing)
  const delta = enough ? asking - Math.min(high, Math.max(low, asking)) : 0
  const rangeDifference = delta ? `${pesos(Math.abs(delta))} ${delta < 0 ? 'below' : 'above'} the usual range` : ''
  const sellerCheck = !band ? 'Ask the seller for a Battery Health screenshot.'
    : ['unknown', 'n/a', 'not sure', 'not disclosed', 'not reported', 'not supplied'].includes(valueOf(listing, 'Repairs').toLowerCase())
      ? 'Ask the seller whether any parts were repaired or replaced.'
      : 'Ask the seller for clear photos of the screen and frame.'
  const matchReason = conditionMatched ? `Compared with listings reporting ${band}.` : 'Compared by model and storage.'
  let verdict = 'Not enough listings to compare'
  let mascot: string | undefined
  if (conditionMatched) {
    verdict = delta < 0 ? 'Good Deal' : delta > 0 ? 'Priced High' : 'Fair Price'
    mascot = delta < 0 ? 'good_deal.png' : delta > 0 ? 'priced_high.png' : 'fair_price.png'
  } else if (enough) {
    verdict = delta < 0 ? 'Lower than similar listings' : delta > high * .05 ? 'Higher than similar listings'
      : delta > 0 ? 'A little higher than usual' : 'Within the usual range'
  }
  return { asking, matches, enough, low, high, median, delta, rangeDifference, conditionMatched,
    matchReason, sellerCheck, verdict, mascot, support: conditionMatched ? rangeDifference || 'In the usual range for similar phones.' : enough ? sellerCheck : '' }
}

export type Evaluation = ReturnType<typeof evaluate>
type Message = { text: string; buyer?: boolean }
export type Session = {
  id: number
  listing: Listing
  completedAt: number
  messages: Message[]
  pending?: { battery: number; replyIndex: number }
  change?: string
}

export function commit(session: Session, listing: Listing): Session {
  const before = evaluate(session.listing)
  const after = evaluate(listing)
  const changed = fields.filter(field => valueOf(session.listing, field) !== valueOf(listing, field))
  const explanation = !after.enough ? 'Not enough listings to compare.'
    : before.conditionMatched && !after.conditionMatched ? 'Now comparing by model and storage only.'
      : before.asking !== after.asking || before.matches.length !== after.matches.length ||
        after.matches.some(row => !before.matches.includes(row)) ? 'Comparison updated.' : 'No change to the price comparison.'
  return { ...session, listing,
    change: changed.length ? `${changed.join(', ')} updated. ${explanation}` : session.change }
}

export const sellerQuestion = 'What should I ask the seller?'
export function comparisonQuestion(e: Evaluation) {
  return !e.enough ? 'Why are there too few matches?' : e.delta > 0 ? 'Why is the price high?'
    : e.delta < 0 ? 'Why is the price low?' : 'How does this price compare?'
}

function proposalText(listing: Listing, battery: number) {
  return `Battery health · ${displayValue(listing, 'Battery health')} → ${battery}%`
}

export function sendMessage(session: Session, input: string): Session {
  const e = evaluate(session.listing)
  const text = input.toLowerCase()
  const number = text.match(/(-?(?:\d+\.?\d*|\.\d+))\s*%/)
  let pending = session.pending
  let reply: string
  if (text === sellerQuestion.toLowerCase()) {
    reply = e.sellerCheck
  } else if (text === comparisonQuestion(e).toLowerCase()) {
    reply = e.enough
      ? `The ${pesos(e.asking)} asking price is ${e.rangeDifference || 'within the usual range'} of ${pesos(e.low)}–${pesos(e.high)}.${e.conditionMatched ? ` ${e.matchReason}` : ''}`
      : `I found ${e.matches.length} listings for this model and storage. A comparison needs at least ${minimumMatches}.`
  } else if (/what if|suppose|hypothetical/.test(text)) {
    reply = 'A different battery percentage can change which listings are compared when enough report similar battery health. A hypothetical does not update your listing.'
  } else if (number && text.includes('battery') && /seller|battery (health )?is/.test(text)) {
    const battery = Number(number[1])
    if (battery < 1 || battery > 100 || !/^\d+$/.test(number[1])) {
      reply = 'Battery health must be a whole percentage from 1 to 100. Check the value with the seller.'
    } else {
      pending = { battery, replyIndex: session.messages.length + 1 }
      reply = proposalText(session.listing, battery)
    }
  } else if (text.includes('battery')) {
    reply = 'Battery health can change which listings support the result when enough report a similar percentage. Ask the seller for a Battery Health screenshot.'
  } else {
    reply = 'I can explain the price comparison or help you check the battery health.'
  }
  return { ...session, pending, messages: [...session.messages, { text: input, buyer: true }, { text: reply }] }
}

export function editProposal(session: Session, value: string): Session {
  if (!session.pending) return session
  if (!value) return { ...session, pending: undefined }
  const pending = { ...session.pending, battery: Number(value) }
  const messages = session.messages.map((message, index) => index === pending.replyIndex
    ? { text: `${proposalText(session.listing, pending.battery)}\nEdited by buyer` }
    : message)
  return { ...session, pending, messages }
}

export function applyProposal(session: Session): Session {
  if (!session.pending) return session
  const listing = withDetail(session.listing, 'Battery health', String(session.pending.battery), 'Seller, via chat')
  return { ...commit(session, listing), pending: undefined }
}
