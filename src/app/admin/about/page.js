// src/app/admin/about/page.js — edit the public About Us page
'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import adminFetch from '@/lib/adminFetch'
import { uploadImageToR2 } from '@/lib/clientUpload'
import AboutView from '@/components/about/AboutView'
import { SECTION_LABELS, AUTO_STATS } from '@/lib/aboutContent'

const move = (list, i, dir) => {
  const j = i + dir
  if (j < 0 || j >= list.length) return list
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

function Field({ label, hint, children }) {
  return (
    <label className="ae-field">
      <span className="ae-label">{label}{hint && <em> — {hint}</em>}</span>
      {children}
    </label>
  )
}

function Text({ value, onChange, placeholder }) {
  return <input className="adm-input" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
}

function Area({ value, onChange, rows = 4, placeholder }) {
  return <textarea className="adm-input" rows={rows} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={{ resize: 'vertical' }} />
}

function ImagePick({ value, onChange, folder }) {
  const [busy, setBusy] = useState(false)
  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Choose an image file')
    setBusy(true)
    try {
      const { url } = await uploadImageToR2(file, folder)
      onChange(url)
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    }
    setBusy(false)
  }
  return (
    <div className="ae-img">
      {value ? <img src={value} alt="" /> : <span className="ae-img-empty">No image</span>}
      <div className="ae-img-actions">
        <label className="ae-btn">
          {busy ? 'Uploading…' : value ? 'Change' : 'Upload'}
          <input type="file" accept="image/*" hidden onChange={pick} disabled={busy} />
        </label>
        {value && <button type="button" className="ae-btn ae-btn-red" onClick={() => onChange('')}>Remove</button>}
      </div>
    </div>
  )
}

function ListControls({ index, length, onMove, onRemove }) {
  return (
    <div className="ae-list-ctrl">
      <button type="button" className="ae-icon" disabled={index === 0} onClick={() => onMove(-1)} title="Move up">↑</button>
      <button type="button" className="ae-icon" disabled={index === length - 1} onClick={() => onMove(1)} title="Move down">↓</button>
      <button type="button" className="ae-icon ae-icon-red" onClick={onRemove} title="Remove">✕</button>
    </div>
  )
}

export default function AdminAboutPage() {
  const [about, setAbout] = useState(null)
  const [defaults, setDefaults] = useState(null)
  const [counts, setCounts] = useState({})
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    adminFetch('/api/admin/about')
      .then(r => r.json())
      .then(d => {
        if (!d.success) throw new Error(d.error)
        setAbout(d.about)
        setDefaults(d.defaults)
        setCounts(d.counts || {})
      })
      .catch(err => toast.error(err.message || 'Failed to load'))
  }, [])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const warn = e => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // set('hero', 'title', value)  — update one field of one section
  const set = (section, field, value) => {
    setAbout(a => ({ ...a, [section]: { ...a[section], [field]: value } }))
    setDirty(true)
  }
  const setList = (section, field, fn) => {
    setAbout(a => ({ ...a, [section]: { ...a[section], [field]: fn(a[section][field]) } }))
    setDirty(true)
  }
  const setItem = (section, field, i, key, value) =>
    setList(section, field, list => list.map((it, k) => (k === i ? { ...it, [key]: value } : it)))

  async function save() {
    setSaving(true)
    try {
      const res = await adminFetch('/api/admin/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ about }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error)
      setAbout(d.about)
      setDirty(false)
      toast.success('About Us page saved')
    } catch (err) {
      toast.error(err.message || 'Save failed')
    }
    setSaving(false)
  }

  function resetAll() {
    if (!confirm('Replace everything with the default text? (Nothing is saved until you press Save.)')) return
    setAbout(defaults)
    setDirty(true)
  }

  if (!about) return <div className="adm-card" style={{ padding: 30 }}>Loading…</div>

  const editors = {
    hero: () => (
      <>
        <Field label="Small label above the title"><Text value={about.hero.eyebrow} onChange={v => set('hero', 'eyebrow', v)} /></Field>
        <Field label="Title"><Text value={about.hero.title} onChange={v => set('hero', 'title', v)} /></Field>
        <Field label="Subtitle"><Area rows={3} value={about.hero.subtitle} onChange={v => set('hero', 'subtitle', v)} /></Field>
        <Field label="Background image" hint="optional"><ImagePick folder="about" value={about.hero.image} onChange={v => set('hero', 'image', v)} /></Field>
      </>
    ),
    story: () => (
      <>
        <Field label="Heading"><Text value={about.story.heading} onChange={v => set('story', 'heading', v)} /></Field>
        <Field label="Text" hint="leave an empty line between paragraphs"><Area rows={8} value={about.story.text} onChange={v => set('story', 'text', v)} /></Field>
        <Field label="Image" hint="optional, shown beside the text"><ImagePick folder="about" value={about.story.image} onChange={v => set('story', 'image', v)} /></Field>
      </>
    ),
    missionVision: () => (
      <div className="ae-2col">
        <div>
          <Field label="Mission heading"><Text value={about.missionVision.missionTitle} onChange={v => set('missionVision', 'missionTitle', v)} /></Field>
          <Field label="Mission"><Area value={about.missionVision.mission} onChange={v => set('missionVision', 'mission', v)} /></Field>
        </div>
        <div>
          <Field label="Vision heading"><Text value={about.missionVision.visionTitle} onChange={v => set('missionVision', 'visionTitle', v)} /></Field>
          <Field label="Vision"><Area value={about.missionVision.vision} onChange={v => set('missionVision', 'vision', v)} /></Field>
        </div>
      </div>
    ),
    stats: () => (
      <>
        <Field label="Heading"><Text value={about.stats.heading} onChange={v => set('stats', 'heading', v)} /></Field>
        {about.stats.items.map((it, i) => (
          <div key={i} className="ae-item">
            <div className="ae-3col">
              <Field label="Label"><Text value={it.label} onChange={v => setItem('stats', 'items', i, 'label', v)} /></Field>
              <Field label="Number">
                <select className="adm-input" value={it.auto} onChange={e => setItem('stats', 'items', i, 'auto', e.target.value)}>
                  <option value="">Type my own</option>
                  {Object.entries(AUTO_STATS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </select>
              </Field>
              {it.auto
                ? <Field label="Shows now"><div className="ae-live">{counts[it.auto] ?? 0}+</div></Field>
                : <Field label="Value" hint="e.g. 5,000+"><Text value={it.value} onChange={v => setItem('stats', 'items', i, 'value', v)} /></Field>}
            </div>
            <ListControls index={i} length={about.stats.items.length}
              onMove={d => setList('stats', 'items', l => move(l, i, d))}
              onRemove={() => setList('stats', 'items', l => l.filter((_, k) => k !== i))} />
          </div>
        ))}
        <button type="button" className="ae-btn" onClick={() => setList('stats', 'items', l => [...l, { label: '', value: '', auto: '' }])}>+ Add number</button>
      </>
    ),
    features: () => (
      <>
        <Field label="Heading"><Text value={about.features.heading} onChange={v => set('features', 'heading', v)} /></Field>
        {about.features.items.map((it, i) => (
          <div key={i} className="ae-item">
            <div className="ae-feature-row">
              <Field label="Icon" hint="emoji"><Text value={it.icon} onChange={v => setItem('features', 'items', i, 'icon', v)} /></Field>
              <Field label="Title"><Text value={it.title} onChange={v => setItem('features', 'items', i, 'title', v)} /></Field>
            </div>
            <Field label="Text"><Area rows={2} value={it.text} onChange={v => setItem('features', 'items', i, 'text', v)} /></Field>
            <ListControls index={i} length={about.features.items.length}
              onMove={d => setList('features', 'items', l => move(l, i, d))}
              onRemove={() => setList('features', 'items', l => l.filter((_, k) => k !== i))} />
          </div>
        ))}
        <button type="button" className="ae-btn" onClick={() => setList('features', 'items', l => [...l, { icon: '⭐', title: '', text: '' }])}>+ Add point</button>
      </>
    ),
    team: () => (
      <>
        <div className="ae-2col">
          <Field label="Heading"><Text value={about.team.heading} onChange={v => set('team', 'heading', v)} /></Field>
          <Field label="Subtitle" hint="optional"><Text value={about.team.subtitle} onChange={v => set('team', 'subtitle', v)} /></Field>
        </div>
        {about.team.members.map((m, i) => (
          <div key={i} className="ae-item">
            <div className="ae-member">
              <ImagePick folder="about/team" value={m.photo} onChange={v => setItem('team', 'members', i, 'photo', v)} />
              <div>
                <div className="ae-2col">
                  <Field label="Name"><Text value={m.name} onChange={v => setItem('team', 'members', i, 'name', v)} /></Field>
                  <Field label="Role"><Text value={m.role} placeholder="e.g. Founder & Mentor" onChange={v => setItem('team', 'members', i, 'role', v)} /></Field>
                </div>
                <Field label="Short bio"><Area rows={2} value={m.bio} onChange={v => setItem('team', 'members', i, 'bio', v)} /></Field>
              </div>
            </div>
            <ListControls index={i} length={about.team.members.length}
              onMove={d => setList('team', 'members', l => move(l, i, d))}
              onRemove={() => setList('team', 'members', l => l.filter((_, k) => k !== i))} />
          </div>
        ))}
        <button type="button" className="ae-btn" onClick={() => setList('team', 'members', l => [...l, { name: '', role: '', photo: '', bio: '' }])}>+ Add team member</button>
      </>
    ),
    cta: () => (
      <>
        <Field label="Title"><Text value={about.cta.title} onChange={v => set('cta', 'title', v)} /></Field>
        <Field label="Text"><Area rows={2} value={about.cta.text} onChange={v => set('cta', 'text', v)} /></Field>
        <div className="ae-2col">
          <Field label="Button text"><Text value={about.cta.buttonLabel} onChange={v => set('cta', 'buttonLabel', v)} /></Field>
          <Field label="Button link" hint="e.g. /join-family or https://…"><Text value={about.cta.buttonLink} onChange={v => set('cta', 'buttonLink', v)} /></Field>
        </div>
      </>
    ),
  }

  return (
    <div className="ae">
      <div className="ae-top">
        <div>
          <h1>🏛️ About Us page</h1>
          <p>Edit every part of the public <a href="/about" target="_blank" rel="noreferrer">About Us</a> page. Changes go live when you save.</p>
        </div>
        <div className="ae-top-actions">
          <button type="button" className="adm-btn-secondary" onClick={() => setPreview(p => !p)}>
            {preview ? '✏️ Back to editing' : '👁 Preview'}
          </button>
          <button type="button" className="adm-btn-secondary" onClick={resetAll}>↺ Default text</button>
          <button type="button" className="adm-btn-primary" onClick={save} disabled={saving || !dirty}>
            {saving ? 'Saving…' : dirty ? '💾 Save changes' : '✓ Saved'}
          </button>
        </div>
      </div>

      {preview ? (
        <div className="ae-preview">
          <AboutView about={about} counts={counts} />
        </div>
      ) : (
        about.order.map((key, i) => (
          <section key={key} className={`adm-card ae-section ${about[key].show ? '' : 'ae-hidden'}`}>
            <header className="ae-section-head">
              <div className="ae-order">
                <button type="button" className="ae-icon" disabled={i === 0}
                  onClick={() => { setAbout(a => ({ ...a, order: move(a.order, i, -1) })); setDirty(true) }} title="Move section up">↑</button>
                <button type="button" className="ae-icon" disabled={i === about.order.length - 1}
                  onClick={() => { setAbout(a => ({ ...a, order: move(a.order, i, 1) })); setDirty(true) }} title="Move section down">↓</button>
              </div>
              <h2>{SECTION_LABELS[key]}</h2>
              <label className="ae-switch">
                <input type="checkbox" checked={about[key].show} onChange={e => set(key, 'show', e.target.checked)} />
                <span>{about[key].show ? 'Shown' : 'Hidden'}</span>
              </label>
            </header>
            {about[key].show && <div className="ae-body">{editors[key]()}</div>}
          </section>
        ))
      )}

      <style>{`
        .ae { display:flex; flex-direction:column; gap:14px; max-width:1000px; }
        .ae-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; position:sticky; top:0; z-index:5; background:#F5F3EF; padding:6px 0 10px; }
        .ae-top h1 { font-family:'Playfair Display',serif; font-size:clamp(18px,3vw,24px); font-weight:800; color:#1B2A4A; margin:0 0 3px; }
        .ae-top p { color:#6B7280; font-size:13px; margin:0; }
        .ae-top a { color:#D4922A; font-weight:700; }
        .ae-top-actions { display:flex; gap:8px; flex-wrap:wrap; }
        .ae-section { padding:0 !important; overflow:hidden; }
        .ae-hidden { opacity:.65; }
        .ae-section-head { display:flex; align-items:center; gap:10px; padding:12px 16px; background:rgba(27,42,74,.03); border-bottom:1px solid #E5E7EB; }
        .ae-section-head h2 { flex:1; font-size:15px; font-weight:800; color:#1B2A4A; margin:0; }
        .ae-order { display:flex; gap:4px; }
        .ae-body { padding:16px; display:flex; flex-direction:column; gap:12px; }
        .ae-field { display:flex; flex-direction:column; gap:5px; }
        .ae-label { font-size:12px; font-weight:700; color:#1B2A4A; }
        .ae-label em { font-weight:400; color:#9CA3AF; font-style:normal; }
        .ae-2col { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .ae-3col { display:grid; grid-template-columns:1.2fr 1.2fr 1fr; gap:12px; }
        .ae-feature-row { display:grid; grid-template-columns:90px 1fr; gap:12px; }
        .ae-item { position:relative; border:1.5px solid #E5E7EB; border-radius:12px; padding:12px 12px 12px; padding-right:110px; display:flex; flex-direction:column; gap:10px; }
        .ae-list-ctrl { position:absolute; top:10px; right:10px; display:flex; gap:4px; }
        .ae-member { display:grid; grid-template-columns:150px 1fr; gap:14px; }
        .ae-live { padding:10px 12px; border-radius:10px; background:rgba(42,157,143,.08); color:#2A9D8F; font-weight:800; }
        .ae-btn { align-self:flex-start; display:inline-flex; align-items:center; padding:8px 14px; border-radius:9px; border:1.5px solid #E5E7EB; background:#fff; color:#1B2A4A; font-weight:700; font-size:12px; cursor:pointer; font-family:inherit; }
        .ae-btn:hover { border-color:#E8A838; }
        .ae-btn-red { color:#DC2626; }
        .ae-icon { width:28px; height:28px; border-radius:8px; border:1.5px solid #E5E7EB; background:#fff; color:#1B2A4A; font-weight:800; cursor:pointer; font-family:inherit; }
        .ae-icon:disabled { opacity:.35; cursor:not-allowed; }
        .ae-icon-red { color:#DC2626; }
        .ae-img { display:flex; flex-direction:column; gap:8px; }
        .ae-img img, .ae-img-empty { width:150px; height:95px; border-radius:10px; object-fit:cover; border:1.5px solid #E5E7EB; background:#F9FAFB; }
        .ae-img-empty { display:flex; align-items:center; justify-content:center; color:#9CA3AF; font-size:12px; }
        .ae-img-actions { display:flex; gap:6px; flex-wrap:wrap; }
        .ae-switch { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:700; color:#6B7280; cursor:pointer; }
        .ae-switch input { width:16px; height:16px; accent-color:#2A9D8F; }
        .ae-preview { border:1.5px solid #E5E7EB; border-radius:16px; overflow:hidden; }
        .ae-preview .ab-hero { padding-top:60px; }
        .ae-preview .ab-page-nohero { padding-top:10px; }
        @media (max-width:700px) {
          .ae-2col, .ae-3col, .ae-member { grid-template-columns:1fr; }
          .ae-item { padding-right:12px; padding-top:46px; }
        }
      `}</style>
    </div>
  )
}
