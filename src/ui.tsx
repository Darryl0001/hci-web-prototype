import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { cleanValue, fieldError, fields, options, type CustomDetail, type Field } from './listing'

const icons = {
  back: <path d="M19 12H5m7-7-7 7 7 7" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  history: <path d="M5 9h14M5 13h8" transform="rotate(-20 12 12)" />,
  home: <path d="m3.5 11 8.5-7.5 8.5 7.5h-3v8h-4v-5h-3v5h-4v-8z" />,
  person: <><circle cx="12" cy="8" r="3" /><path d="M5 19v-1.5c0-4.5 14-4.5 14 0V19z" /></>,
  chevron: <path d="m9 6 6 6-6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  edit: <path d="m13 6 5 5M4 20l1.3-5L16 4a1.4 1.4 0 0 1 2 0l2 2a1.4 1.4 0 0 1 0 2L9 19z" />,
  add: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 4 4L19 6" />,
  send: <path d="M12 19V5m-6 6 6-6 6 6" />,
}

type IconName = keyof typeof icons

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">{icons[name]}</svg>
}

export function Circle({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return <button className="circle" type="button" aria-label={label} onClick={onClick}><Icon name={icon} /></button>
}

export function Primary({ children, onClick, submit = false, className = '' }: {
  children: ReactNode; onClick?: () => void; submit?: boolean; className?: string
}) {
  return <button className={`primary ${className}`} type={submit ? 'submit' : 'button'} onClick={onClick}>{children}</button>
}

export function TextButton({ children, onClick, className = '' }: {
  children: ReactNode; onClick: () => void; className?: string
}) {
  return <button className={`text-button ${className}`} type="button" onClick={onClick}>{children}</button>
}

export function DetailRow({ label, value, note, onClick, icon = 'chevron' }: {
  label: string; value: string; note?: string; onClick?: () => void; icon?: IconName
}) {
  const content = <>
    <span className="detail-label">{label}</span>
    <span className={`detail-value ${value === 'Unknown' ? 'text-muted' : ''}`}>
      {value}{note && <span className="mt-1 block text-xs font-normal text-muted">{note}</span>}
    </span>
    {onClick && <span className="ml-2 text-muted"><Icon name={icon} size={18} /></span>}
  </>
  return onClick
    ? <button className="detail-row" type="button" onClick={onClick}>{content}</button>
    : <div className="detail-row">{content}</div>
}

export function PageHeader({ title, subtitle, back }: { title: string; subtitle?: string; back: () => void }) {
  return <header className="shrink-0 px-5 pt-4 pb-3">
    <div className="mb-5"><Circle icon="back" label="Back" onClick={back} /></div>
    <h1>{title}</h1>
    {subtitle && <p className="support mt-2 whitespace-pre-line">{subtitle}</p>}
  </header>
}

export function Modal({ children, close, label, drawer = false }: {
  children: ReactNode; close: () => void; label: string; drawer?: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    return () => element.close()
  }, [])

  return <dialog ref={dialog} className={drawer ? 'drawer' : 'sheet'} aria-label={label}
    onCancel={event => { event.preventDefault(); close() }}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close()
    }}>
    {!drawer && <div className="sheet-handle" aria-hidden="true" />}
    {children}
  </dialog>
}

export function SheetTitle({ children, close, label = 'Cancel edit', large = false }: {
  children: ReactNode; close: () => void; label?: string; large?: boolean
}) {
  return <header className="flex items-center justify-between gap-3">
    {large ? <h1>{children}</h1> : <h2>{children}</h2>}
    <Circle icon="close" label={label} onClick={close} />
  </header>
}

export function FieldEditor({ field, initial, source, required, confirmSelection, onSave, close }: {
  field: Field; initial: string; source?: string; required: boolean; confirmSelection: boolean;
  onSave: (value: string) => void; close: () => void
}) {
  const [value, setValue] = useState(initial)
  const [error, setError] = useState('')
  const errorId = useId()
  const choices = options[field]
  const title = field === 'Listed condition' ? 'Condition' : field
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const clean = cleanValue(field, value)
    const message = fieldError(field, clean, required)
    if (message) setError(message)
    else onSave(clean)
  }

  return <form onSubmit={save} noValidate>
    <SheetTitle close={close}>{title}</SheetTitle>
    {source && <p className="support mt-5">Source: {source}</p>}
    {choices ? <div className="mt-4">
      {choices.map(choice => <button key={choice} type="button" className="option-row" aria-pressed={value === choice}
        onClick={() => { if (confirmSelection) setValue(choice); else onSave(choice) }}>
        {choice}{value === choice && <Icon name="check" />}
      </button>)}
    </div> : <label className="field-box mt-5">
      <span>{title}</span>
      <div className="flex items-center gap-2">
        <input autoFocus inputMode={field === 'Asking price' ? 'decimal' : field === 'Battery health' ? 'numeric' : undefined}
          value={value} onChange={event => setValue(event.target.value)} aria-invalid={!!error} aria-describedby={error ? errorId : undefined} />
        {field === 'Battery health' && <span aria-hidden="true">%</span>}
      </div>
    </label>}
    {error && <p id={errorId} className="error mt-2" role="alert">{error}</p>}
    {(!choices || confirmSelection) && <Primary submit className="mt-5">Save detail</Primary>}
    {!required && <TextButton className="w-full" onClick={() => onSave('')}>Remove value</TextButton>}
  </form>
}

export function CustomEditor({ details, index, close, onSave }: {
  details: CustomDetail[]; index: number | null; close: () => void; onSave: (details: CustomDetail[]) => void
}) {
  const initial = index === null ? undefined : details[index]
  const [name, setName] = useState(initial?.name ?? '')
  const [value, setValue] = useState(initial?.value ?? '')
  const [errors, setErrors] = useState({ name: '', value: '' })
  const normalize = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase()

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const proposed = normalize(name)
    const taken = ['Condition', ...fields, ...details.filter((_, i) => i !== index).map(detail => detail.name)]
      .some(existing => normalize(existing) === proposed)
    const next = { name: !proposed ? 'Enter a detail name' : taken ? 'This detail name is already in use' : '',
      value: value.trim() ? '' : 'Enter a value' }
    setErrors(next)
    if (next.name || next.value) return
    const detail = { name: name.trim(), value: value.trim() }
    onSave(index === null ? [...details, detail] : details.map((item, i) => i === index ? detail : item))
  }

  return <form onSubmit={save}>
    <SheetTitle close={close}>{index === null ? 'Add custom detail' : 'Edit custom detail'}</SheetTitle>
    <label className="field-box mt-5">Detail name<input autoFocus={index === null} value={name} onChange={event => setName(event.target.value)} /></label>
    {errors.name && <p className="error mt-1" role="alert">{errors.name}</p>}
    <label className="field-box mt-3">Value<textarea autoFocus={index !== null} rows={2} value={value} onChange={event => setValue(event.target.value)} /></label>
    {errors.value && <p className="error mt-1" role="alert">{errors.value}</p>}
    <Primary submit className="mt-5">Save detail</Primary>
    {index !== null && <TextButton className="w-full" onClick={() => onSave(details.filter((_, i) => i !== index))}>Remove detail</TextButton>}
  </form>
}

export function CustomRows({ details, edit }: { details: CustomDetail[]; edit: (index: number | null) => void }) {
  return <>
    {details.map((detail, index) => <DetailRow key={detail.name} label={detail.name} value={detail.value} icon="edit" onClick={() => edit(index)} />)}
    <TextButton className="gap-2" onClick={() => edit(null)}><Icon name="add" size={18} />Add custom detail</TextButton>
  </>
}

export function Screenshot({ src, className = '' }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  return failed ? <p className={`support ${className}`}>Image unavailable. Try a different screenshot.</p>
    : <img className={`rounded-3xl ${className}`} src={src} alt="Listing screenshot" onError={() => setFailed(true)} />
}
