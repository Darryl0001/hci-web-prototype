import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  applyProposal, batteryDemo, commit, editProposal, emptyListing, evaluate, requiredFields, screenshotDemo,
  sendMessage, sourceOf, uploadDemo, valueOf, withDetail, type Field, type Listing, type Session,
} from './listing'
import { Chat, DemoPicker, Evidence, History, Profile, Result, Review, ReviewUpdate, SessionHeader, Start, TabBar } from './screens'
import { CustomEditor, FieldEditor, Modal, Screenshot, SheetTitle } from './ui'

type Screen = 'home' | 'review' | 'evidence' | 'chat'
type Overlay = { kind: 'history' | 'demos' | 'image' | 'update' | 'proposal' }
  | { kind: 'field'; field: Field }
  | { kind: 'custom'; index: number | null }

const demos = [
  { label: 'Demo: 94% battery', listing: batteryDemo(94) },
  { label: 'Demo: 76% battery', listing: batteryDemo(76) },
  { label: 'Sample screenshot', listing: screenshotDemo() },
  { label: 'Sample: shorthand price', listing: screenshotDemo(true) },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [profile, setProfile] = useState(false)
  const [draft, setDraft] = useState<Listing>()
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeId, setActiveId] = useState<number>()
  const [overlay, setOverlay] = useState<Overlay>()
  const [expanded, setExpanded] = useState(false)
  const [imageError, setImageError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const replacing = useRef(false)
  const nextId = useRef(0)
  const resultScroll = useRef(0)
  const imageUrls = useRef(new Set<string>())
  const session = sessions.find(item => item.id === activeId)
  const result = session && evaluate(session.listing)
  const listing = screen === 'review' ? draft : session?.listing

  useEffect(() => {
    const images = new Set([draft?.image, ...sessions.map(item => item.listing.image)])
    for (const url of imageUrls.current) {
      if (!images.has(url)) {
        URL.revokeObjectURL(url)
        imageUrls.current.delete(url)
      }
    }
  }, [draft, sessions])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const resize = () => {
      const height = viewport.scale === 1 ? `${viewport.height}px` : ''
      document.documentElement.style.setProperty('--app-height', height)
    }
    resize()
    viewport.addEventListener('resize', resize)
    return () => {
      viewport.removeEventListener('resize', resize)
      document.documentElement.style.removeProperty('--app-height')
    }
  }, [])

  function update(transform: (current: Session) => Session) {
    setSessions(items => items.map(item => item.id === activeId ? transform(item) : item))
  }

  function openReview(value: Listing) {
    setImageError('')
    setDraft(value)
    setOverlay(undefined)
    setScreen('review')
  }

  function compare() {
    if (!draft) return
    const id = ++nextId.current
    const checked = { listing: draft, id, completedAt: Date.now(), messages: [] }
    setSessions(items => [checked, ...items])
    setDraft(undefined)
    openEvaluation(id)
  }

  function openEvaluation(id: number) {
    resultScroll.current = 0
    setActiveId(id)
    setExpanded(false)
    setOverlay(undefined)
    setProfile(false)
    setScreen('home')
  }

  function newCheck() {
    setActiveId(undefined)
    setImageError('')
  }

  function pickImage(replace: boolean) {
    replacing.current = replace
    if (fileInput.current) {
      fileInput.current.value = ''
      fileInput.current.click()
    }
  }

  function fileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    if (file.type && !file.type.startsWith('image/')) {
      setImageError('Could not open that image. Try again or enter details manually.')
      return
    }
    const image = URL.createObjectURL(file)
    imageUrls.current.add(image)
    if (replacing.current && draft) {
      setImageError('')
      setDraft({ ...draft, image })
    } else {
      openReview(uploadDemo(image))
    }
  }

  function saveListing(next: Listing) {
    if (screen === 'review') setDraft(next)
    else update(current => commit(current, next))
    setOverlay(undefined)
  }

  function applyUpdate() {
    update(applyProposal)
    resultScroll.current = 0
    setOverlay(undefined)
    setScreen('home')
  }

  const close = () => setOverlay(undefined)
  const edit = (field: Field) => setOverlay({ kind: 'field', field })
  const editCustom = (index: number | null) => setOverlay({ kind: 'custom', index })
  const preview = () => setOverlay({ kind: 'image' })
  const back = () => setScreen('home')

  return <div className="app-shell">
    <input ref={fileInput} type="file" accept="image/*" hidden onChange={fileSelected} />
    {screen === 'home' && <>
      {profile ? <Profile /> : <>
        <SessionHeader history={() => setOverlay({ kind: 'history' })} newCheck={session && newCheck} />
        {session && result ? <Result key={session.id} session={session} result={result}
          evidence={() => setScreen('evidence')} chat={() => setScreen('chat')} edit={edit} editCustom={editCustom} preview={preview}
          expanded={expanded} toggle={() => setExpanded(value => !value)} scrollPosition={resultScroll.current}
          saveScroll={offset => { resultScroll.current = offset }} />
          : <Start upload={() => pickImage(false)} manual={() => openReview(emptyListing())} demo={() => setOverlay({ kind: 'demos' })} />}
      </>}
      <TabBar profile={profile} select={setProfile} />
    </>}
    {screen === 'review' && draft && <Review listing={draft} back={() => { setDraft(undefined); setImageError(''); back() }}
      edit={edit} editCustom={editCustom} preview={preview} replace={() => pickImage(true)} compare={compare}
      confirm={() => setDraft(value => value && { ...value, confirmed: true })} />}
    {screen === 'evidence' && result && <Evidence result={result} back={back} />}
    {screen === 'chat' && session && result && <Chat session={session} result={result} back={back}
      send={text => update(current => sendMessage(current, text))} review={() => setOverlay({ kind: 'update' })} />}
    {imageError && <div role="alert" className="image-error">
      <span>{imageError}</span><button type="button" onClick={() => setImageError('')}>Dismiss</button>
    </div>}

    {overlay?.kind === 'history' && <Modal close={close} label="History" drawer>
      <History sessions={sessions} close={close} open={openEvaluation} />
    </Modal>}
    {overlay?.kind === 'demos' && <Modal close={close} label="Demo listings">
      <DemoPicker demos={demos} close={close} open={openReview} />
    </Modal>}
    {overlay?.kind === 'image' && listing?.image && <Modal close={close} label="Listing screenshot">
      <div className="flex h-[min(75dvh,calc(var(--app-height,100dvh)-96px))] min-h-0 flex-col">
        <SheetTitle close={close} label="Close screenshot">Listing screenshot</SheetTitle>
        <Screenshot src={listing.image} className="mx-auto mt-5 min-h-0 max-w-full flex-1 object-contain" />
      </div>
    </Modal>}
    {overlay?.kind === 'field' && listing && (() => {
      const field = overlay.field
      const onResult = screen === 'home'
      const used = result?.enough && (requiredFields.includes(field) || (field === 'Battery health' && result.conditionMatched))
      const source = `${sourceOf(listing, field)}${onResult ? used ? ' · Used in comparison'
        : valueOf(listing, field) === 'Unknown' ? ' · Ask seller' : ' · Verify with seller' : ''}`
      return <Modal close={close} label={field}>
        <FieldEditor field={field} initial={listing.values[field] ?? ''} source={source} close={close}
          required={onResult && requiredFields.includes(field)} confirmSelection={onResult}
          onSave={value => saveListing(withDetail(listing, field, value))} />
      </Modal>
    })()}
    {overlay?.kind === 'custom' && listing && <Modal close={close} label={overlay.index === null ? 'Add custom detail' : 'Edit custom detail'}>
      <CustomEditor details={listing.custom} index={overlay.index} close={close} onSave={custom => saveListing({ ...listing, custom })} />
    </Modal>}
    {overlay?.kind === 'update' && session?.pending && <Modal key="update" close={close} label="Review update">
      <ReviewUpdate session={session} close={close} edit={() => setOverlay({ kind: 'proposal' })}
        remove={() => { update(current => editProposal(current, '')); close() }} apply={applyUpdate} />
    </Modal>}
    {overlay?.kind === 'proposal' && session?.pending && <Modal key="proposal" close={() => setOverlay({ kind: 'update' })} label="Edit battery health">
      <FieldEditor field="Battery health" initial={String(session.pending.battery)} required={false} confirmSelection={false}
        close={() => setOverlay({ kind: 'update' })} onSave={value => {
          update(current => editProposal(current, value))
          setOverlay(value ? { kind: 'update' } : undefined)
        }} />
    </Modal>}
  </div>
}
