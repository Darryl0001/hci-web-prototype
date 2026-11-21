import { useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import {
  asset, comparisonQuestion, displayValue, fieldError, fields, listingTitle, minimumMatches,
  pesos, priceOf, recencyDays, requiredFields, sellerQuestion, sourceOf,
  type Evaluation, type Field, type Listing, type Session,
} from './listing'
import { Circle, CustomRows, DetailRow, Icon, PageHeader, Primary, Screenshot, SheetTitle, TextButton } from './ui'

export function SessionHeader({ history, newCheck }: { history: () => void; newCheck?: () => void }) {
  return <header className="flex shrink-0 items-center justify-between px-5 pt-3">
    <Circle icon="history" label="Open history" onClick={history} />
    {newCheck && <TextButton className="px-0" onClick={newCheck}>New +</TextButton>}
  </header>
}

export function Start({ upload, manual, demo }: { upload: () => void; manual: () => void; demo: () => void }) {
  return <main className="start scroll-area" aria-label="Check a listing">
    <div className="start-actions">
      <Primary onClick={upload}>Upload screenshot</Primary>
      <TextButton className="mt-1 w-full" onClick={manual}>Enter details manually</TextButton>
      <TextButton className="w-full" onClick={demo}>Try demo listings</TextButton>
    </div>
  </main>
}

export function TabBar({ profile, select }: { profile: boolean; select: (profile: boolean) => void }) {
  return <nav className="tab-bar" aria-label="Main navigation">
    <button type="button" aria-current={!profile ? 'page' : undefined} onClick={() => select(false)}><Icon name="home" />Home</button>
    <button type="button" aria-current={profile ? 'page' : undefined} onClick={() => select(true)}><Icon name="person" />Profile</button>
  </nav>
}

export function Profile() {
  return <main className="scroll-area px-5 py-7">
    <h1>Profile</h1>
    <div className="mt-9 grid size-16 place-items-center rounded-full bg-white text-muted"><Icon name="person" size={30} /></div>
    <h2 className="mt-4">Guest</h2>
  </main>
}

export function History({ sessions, close, open }: { sessions: Session[]; close: () => void; open: (id: number) => void }) {
  return <>
    <div className="shrink-0 pt-5 pr-3 pb-3 pl-5">
      <SheetTitle close={close} label="Close history">History</SheetTitle>
    </div>
    {sessions.length === 0 ? <div className="grid min-h-0 flex-1 place-items-center px-5">
      <p className="support text-center">No checks yet</p>
    </div> : <div className="scroll-area px-5">
      {sessions.map(session => <button key={session.id} type="button" className="block w-full border-b border-line py-[18px] text-left" onClick={() => open(session.id)}>
        <strong className="font-semibold">{listingTitle(session.listing)}</strong>
        <span className="mt-1.5 block">{pesos(priceOf(session.listing))}</span>
        <span className="support mt-1 block">{new Date(session.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </button>)}
    </div>}
  </>
}

type EditActions = { edit: (field: Field) => void; editCustom: (index: number | null) => void; preview: () => void }

export function Review({ listing, back, edit, editCustom, preview, replace, compare, confirm }: EditActions & {
  listing: Listing; back: () => void; replace: () => void; compare: () => void; confirm: () => void
}) {
  const [validate, setValidate] = useState(false)
  const detailsRef = useRef<HTMLElement>(null)
  const simulated = Object.values(listing.sources).includes('Demo data')
  const subtitle = simulated ? 'Demo data · Simulated details. Review before comparing.'
    : listing.image ? 'Read from the sample. Tap a detail to correct it.'
      : 'Fill in what the listing says. Leave missing details unknown.'
  const errorFor = (field: Field) => fieldError(field, listing.values[field] ?? '', requiredFields.includes(field))

  function submit() {
    setValidate(true)
    const first = fields.find(field => errorFor(field) || (field === 'Asking price' && !listing.confirmed))
    if (!first) compare()
    else detailsRef.current?.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ block: 'nearest' })
  }

  return <>
    <PageHeader title="Check the details" subtitle={subtitle} back={back} />
    <main ref={detailsRef} className="scroll-area px-5 pt-2 pb-6">
      {listing.image && <div className="mb-4 flex items-center gap-4">
        <Screenshot key={listing.image} src={listing.image} className="h-[86px] w-[76px] shrink-0 object-cover" />
        <div className="flex flex-col items-start">
          <TextButton onClick={preview}>View screenshot</TextButton>
          <TextButton onClick={replace}>Replace screenshot</TextButton>
        </div>
      </div>}
      {fields.map(field => <div key={field} data-field={field}>
        <DetailRow label={field} value={displayValue(listing, field)} onClick={() => edit(field)}
          note={sourceOf(listing, field) === 'Demo data' ? 'Demo data' : undefined} />
        {validate && errorFor(field) && <p className="error mt-1.5" role="alert">{errorFor(field)}</p>}
        {field === 'Asking price' && !listing.confirmed && <>
          <p className="support mt-2.5">The sample says “PHP22”. Confirm the proposed amount, or tap Asking price to edit it.</p>
          {!!priceOf(listing) && <TextButton onClick={confirm}>Confirm {pesos(priceOf(listing))}</TextButton>}
        </>}
      </div>)}
      <CustomRows details={listing.custom} edit={editCustom} />
    </main>
    <footer className="screen-action pt-3"><Primary onClick={submit}>Compare price</Primary></footer>
  </>
}

const firstFields: Field[] = ['Battery health', 'Listed condition', 'Network lock']
const resultFields = [...firstFields, ...fields.filter(field => !firstFields.includes(field))]

export function Result({ session, result, evidence, chat, edit, editCustom, preview, expanded, toggle, scrollPosition, saveScroll }: EditActions & {
  session: Session; result: Evaluation; evidence: () => void; chat: () => void; expanded: boolean; toggle: () => void;
  scrollPosition: number; saveScroll: (offset: number) => void
}) {
  const listing = session.listing
  const scroll = useRef<HTMLElement>(null)
  const initialScroll = useRef(scrollPosition)
  useLayoutEffect(() => { if (scroll.current) scroll.current.scrollTop = initialScroll.current }, [])
  const battery = listing.values['Battery health'] ? `${displayValue(listing, 'Battery health')} battery` : 'Battery unknown'
  const condition = listing.values['Listed condition'] || 'Condition unknown'

  return <>
    <main ref={scroll} onScroll={event => saveScroll(event.currentTarget.scrollTop)} className="scroll-area pt-6 pb-8">
      <p className="px-5 pb-4 text-center font-semibold tracking-[-.02em]">{listingTitle(listing)}</p>
      <div className="px-5 pb-6 text-center">
        {result.mascot && <img className="mx-auto mb-2 size-[116px] object-contain" src={asset(result.mascot)} alt="" />}
        <h1 className="verdict">{result.verdict}</h1>
        {result.support && <p className="support mt-2">{result.support}</p>}
      </div>
      <div className="comparison-panel">
        <div className="comparison-row"><span>Seller asks</span><strong>{pesos(result.asking)}</strong></div>
        {result.enough && <>
          <div className="comparison-row border-t border-line"><span>Similar listings ask</span><strong>{pesos(result.low)}–{pesos(result.high)}</strong></div>
          <p className="mt-3.5">{result.matchReason}</p>
        </>}
        <div className="mt-3.5 border-t border-line">
          <TextButton className="px-0 text-left" onClick={evidence}>See {result.matches.length} compared listings →</TextButton>
        </div>
      </div>
      <div className="px-5 pt-6">
        {session.change && <div className="mb-6">
          <h2 className="text-sm font-semibold tracking-normal">What changed</h2>
          <p className="support mt-1.5">{session.change}</p>
        </div>}
        <button type="button" aria-expanded={expanded} aria-controls="listing-details" className="flex w-full items-center justify-between gap-3 py-4 text-left" onClick={toggle}>
          <span><strong className="block font-semibold tracking-[-.025em]">Listing details</strong><span className="support block">{battery} · {condition}</span></span>
          <span className="text-muted"><Icon name={expanded ? 'down' : 'chevron'} /></span>
        </button>
        {expanded && <div id="listing-details" className="border-t border-line">
          {resultFields.map(field => <DetailRow key={field} label={field === 'Listed condition' ? 'Condition' : field}
            value={displayValue(listing, field)} icon="edit" onClick={() => edit(field)} />)}
          <CustomRows details={listing.custom} edit={editCustom} />
          {listing.image && <TextButton className="w-full" onClick={preview}>View screenshot</TextButton>}
        </div>}
      </div>
    </main>
    <footer className="screen-action pt-4"><Primary className="result-action" onClick={chat}>Ask about this listing</Primary></footer>
  </>
}

function PriceRange({ result }: { result: Evaluation }) {
  const fraction = (price: number) => result.high === result.low ? 50
    : Math.max(0, Math.min(100, 100 * (price - result.low) / (result.high - result.low)))
  const listing = `${fraction(result.asking)}%`
  const median = `${fraction(result.median)}%`
  return <div role="img" aria-label={`Typical asking prices ${pesos(result.low)} to ${pesos(result.high)}. This listing ${pesos(result.asking)}. Median ${pesos(result.median)}.`}>
    <div className="range-chart" aria-hidden="true">
      <div className="range-line" />
      <div className="range-median" style={{ left: median }} />
      <div className="range-listing" style={{ left: listing }} />
      <span className="range-label range-label-top" style={{ left: `clamp(33px, ${listing}, calc(100% - 33px))` }}>This listing</span>
      <span className="range-label range-label-bottom" style={{ left: `clamp(24px, ${median}, calc(100% - 24px))` }}>Median</span>
    </div>
    <div className="support mt-2 flex justify-between gap-2"><span>{pesos(result.low)}</span><span>{pesos(result.high)}</span></div>
  </div>
}

export function Evidence({ result, back }: { result: Evaluation; back: () => void }) {
  const delta = result.asking - result.median
  const difference = delta === 0 ? `Matches the ${pesos(result.median)} median.`
    : `${pesos(Math.abs(delta))} ${delta > 0 ? 'above' : 'below'} the ${pesos(result.median)} median.`
  return <>
    <PageHeader title="Compared listings" back={back}
      subtitle={`${result.matches.length} matches · Bundled demo data\nSame model and storage, listed within ${recencyDays} days.`} />
    <main className="scroll-area px-5 pt-3 pb-6">
      <p className="support">{result.matches.length} matched listings · Minimum {minimumMatches}</p>
      {result.enough ? <>
        {result.conditionMatched && <p className="mt-2">{result.matchReason}</p>}
        <h2 className="section-title">Comparison breakdown</h2>
        <DetailRow label="This listing" value={pesos(result.asking)} />
        <DetailRow label="Median asking price" value={pesos(result.median)} />
        <p className="support mt-3">{difference}</p>
        <h2 className="section-title">Typical asking prices</h2>
        <PriceRange result={result} />
        <p className="support mt-3">Middle half of matched asking prices.</p>
        {result.rangeDifference && <p className="support">{result.rangeDifference}</p>}
      </> : <h2 className="mt-4">Not enough listings to compare</h2>}
      {!!result.matches.length && <h2 className="section-title">Sample listings</h2>}
      {result.matches.map((row, index) => <article key={index} className="border-b border-line py-5">
        <h3 className="text-2xl font-semibold tabular-nums">{pesos(row.price)}</h3>
        <p className="mt-1.5">{row.model} · {row.storage}</p>
        <p className="support mt-1">{row.location} · {row.age} days ago<br />Battery health: {row.battery}</p>
      </article>)}
      <p className="support mt-6">These sample rows are the exact asking prices used in this comparison. They are not live marketplace listings.</p>
    </main>
  </>
}

export function Chat({ session, result, back, send, review }: {
  session: Session; result: Evaluation; back: () => void; send: (text: string) => void; review: () => void
}) {
  const [input, setInput] = useState('')
  const scroll = useRef<HTMLDivElement>(null)
  const empty = !session.messages.length
  useLayoutEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight
  }, [session.messages.length])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!input.trim()) return
    send(input.trim())
    setInput('')
  }

  return <>
    <header className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-3">
      <Circle icon="back" label="Back to evaluation" onClick={back} />
      <div><h1 className="chat-title">Ask Second Look</h1><p className="support mt-0.5">{listingTitle(session.listing)}</p></div>
    </header>
    <main className="flex min-h-0 flex-1 flex-col">
      <div ref={scroll} className={`scroll-area ${empty ? 'chat-empty' : 'p-5'}`} role="log" aria-label="Conversation" aria-live="polite">
        {empty ? <div className="chat-suggestions">
          {[comparisonQuestion(result), sellerQuestion].map(question => <TextButton key={question} className="w-full justify-start px-0 text-left" onClick={() => { send(question); setInput('') }}>{question}</TextButton>)}
        </div> : session.messages.map((message, index) => <div key={index} className={`message ${message.buyer ? 'buyer' : ''}`}>
          <p>{message.text}</p>
          {session.pending?.replyIndex === index && <TextButton className="px-0" onClick={review}>Review update</TextButton>}
        </div>)}
      </div>
      <footer className="screen-action pt-2">
        <form onSubmit={submit} className="composer">
          <input aria-label="Ask or add a detail" placeholder="Ask or add a detail…" enterKeyHint="send" value={input} onChange={event => setInput(event.target.value)} />
          <button type="submit" aria-label="Send message" disabled={!input.trim()}><Icon name="send" /></button>
        </form>
      </footer>
    </main>
  </>
}

export function ReviewUpdate({ session, close, edit, remove, apply }: { session: Session; close: () => void; edit: () => void; remove: () => void; apply: () => void }) {
  return <>
    <SheetTitle close={close} label="Close review update" large>Review update</SheetTitle>
    <h2 className="section-title">Battery health</h2>
    <div className="flex flex-wrap gap-x-10 gap-y-4">
      <div><p className="support">Current</p><p className="mt-1.5 text-[1.625rem] font-semibold">{displayValue(session.listing, 'Battery health')}</p></div>
      <div><p className="support">Proposed</p><p className="mt-1.5 text-[1.625rem] font-semibold">{session.pending?.battery}%</p></div>
    </div>
    <p className="support mt-5">Source: Seller, via chat</p>
    <div className="flex gap-0.5"><TextButton onClick={edit}>Edit</TextButton><TextButton onClick={remove}>Remove</TextButton></div>
    <Primary className="mt-5" onClick={apply}>Apply update</Primary>
  </>
}

export function DemoPicker({ demos, close, open }: { demos: { label: string; listing: Listing }[]; close: () => void; open: (listing: Listing) => void }) {
  return <>
    <SheetTitle close={close} label="Close demo listings">Demo listings</SheetTitle>
    {demos.map(({ label, listing }) => <button className="option-row" type="button" key={label} onClick={() => open(listing)}>
      <span>{label}<span className="support block">{listingTitle(listing)} · {pesos(priceOf(listing))}</span></span><Icon name="chevron" />
    </button>)}
  </>
}
