// src/app/admin/coupons/page.js
'use client'
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  code: '', discountType: 'percentage',
  discountValue: '', maxUses: 100, expiryDate: '',
}
const EMPTY_SETTINGS = {
  subscriptionPrice: 999,
  subscriptionMonths: 4,
}

export default function AdminCouponsPage() {
  const [coupons,     setCoupons]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(null)
  const [editId,      setEditId]      = useState(null)
  const [origForm,    setOrigForm]    = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [screenSize,  setScreenSize]  = useState('desktop')

  const [settings,            setSettings]            = useState(EMPTY_SETTINGS)
  const [origSettings,        setOrigSettings]        = useState(EMPTY_SETTINGS)
  const [settingsLoading,     setSettingsLoading]     = useState(true)
  const [settingsSaving,      setSettingsSaving]      = useState(false)
  const [showSettingsConfirm, setShowSettingsConfirm] = useState(false)

  /* ── Screen size ── */
  useEffect(() => {
    function check() {
      const w = window.innerWidth
      if (w < 640)       setScreenSize('mobile')
      else if (w < 1024) setScreenSize('tablet')
      else               setScreenSize('desktop')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const isMobile  = screenSize === 'mobile'
  const isTablet  = screenSize === 'tablet'
  const isDesktop = screenSize === 'desktop'

  /* ── Fetch ── */
  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/coupons', { credentials: 'include' })
      const data = await res.json()
      if (data.success) setCoupons(data.coupons || [])
      else toast.error(data.error || 'Failed to load coupons')
    } catch { toast.error('Failed to fetch coupons') }
    setLoading(false)
  }, [])

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true)
    try {
      const res  = await fetch('/api/admin/settings', { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setSettings(data.settings)
        setOrigSettings(data.settings)
      }
    } catch {}
    setSettingsLoading(false)
  }, [])

  useEffect(() => { fetchCoupons(); fetchSettings() }, [fetchCoupons, fetchSettings])

  /* ── Settings dirty ── */
  const isSettingsDirty =
    settings.subscriptionPrice  !== origSettings.subscriptionPrice ||
    settings.subscriptionMonths !== origSettings.subscriptionMonths

  async function handleSaveSettings(confirmed = false) {
    if (!confirmed) { setShowSettingsConfirm(true); return }
    setSettingsSaving(true)
    try {
      const res  = await fetch('/api/admin/settings', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (data.success) {
        setOrigSettings(data.settings)
        setSettings(data.settings)
        toast.success('Subscription settings saved!')
        setShowSettingsConfirm(false)
      } else toast.error(data.error || 'Failed to save settings')
    } catch { toast.error('Failed to save settings') }
    setSettingsSaving(false)
  }

  /* ── Coupon helpers ── */
  const isDirty = editId && origForm
    ? JSON.stringify(form) !== JSON.stringify(origForm)
    : false

  function openEdit(coupon) {
    const snap = {
      code:          coupon.code,
      discountType:  coupon.discountType,
      discountValue: String(coupon.discountValue),
      maxUses:       coupon.maxUses,
      expiryDate:    coupon.expiryDate
        ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
    }
    setForm(snap); setOrigForm(snap)
    setEditId(coupon._id); setShowForm(true); setShowConfirm(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeForm() {
    setShowForm(false); setEditId(null)
    setOrigForm(null); setShowConfirm(false); setForm(EMPTY_FORM)
  }

  function validate() {
    if (!form.code.trim() || !form.discountValue) {
      toast.error('Code and discount value are required'); return false
    }
    if (form.discountType === 'percentage' &&
      (parseFloat(form.discountValue) > 100 || parseFloat(form.discountValue) < 1)) {
      toast.error('Percentage must be between 1–100'); return false
    }
    return true
  }

  async function handleSave(e) {
    e?.preventDefault()
    if (!validate()) return
    if (editId && isDirty && !showConfirm) { setShowConfirm(true); return }
    setSaving(true)
    try {
      const payload = {
        code:          form.code.trim().toUpperCase(),
        discountType:  form.discountType,
        discountValue: parseFloat(form.discountValue),
        maxUses:       parseInt(form.maxUses) || 100,
        expiryDate:    form.expiryDate || null,
      }
      const url    = editId ? `/api/admin/coupons?id=${editId}` : '/api/admin/coupons'
      const method = editId ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editId ? 'Coupon updated!' : 'Coupon created!')
        closeForm(); await fetchCoupons()
      } else toast.error(data.error || (editId ? 'Update failed' : 'Create failed'))
    } catch { toast.error('Something went wrong') }
    setSaving(false); setShowConfirm(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this coupon?')) return
    setDeleting(id)
    try {
      const res  = await fetch(`/api/admin/coupons?id=${id}`, {
        method: 'DELETE', credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setCoupons(prev => prev.filter(c => c._id !== id))
        toast.success('Coupon deleted')
        if (editId === id) closeForm()
      } else toast.error(data.error || 'Delete failed')
    } catch { toast.error('Failed to delete coupon') }
    setDeleting(null)
  }

  function getChangedFields() {
    if (!origForm) return []
    const labels = {
      code: 'Code', discountType: 'Type',
      discountValue: 'Value', maxUses: 'Max Uses', expiryDate: 'Expiry',
    }
    return Object.keys(labels)
      .filter(k => String(form[k]) !== String(origForm[k]))
      .map(k => ({ key: k, label: labels[k], from: origForm[k] || '—', to: form[k] || '—' }))
  }

  function getSettingsChangedFields() {
    const changes = []
    if (settings.subscriptionPrice !== origSettings.subscriptionPrice)
      changes.push({ label: 'Price', from: `₹${origSettings.subscriptionPrice}`, to: `₹${settings.subscriptionPrice}` })
    if (settings.subscriptionMonths !== origSettings.subscriptionMonths)
      changes.push({ label: 'Duration', from: `${origSettings.subscriptionMonths}mo`, to: `${settings.subscriptionMonths}mo` })
    return changes
  }

  /* ─────────────────────────────────────────
     MOBILE COUPON CARD
  ───────────────────────────────────────── */
  function MobileCouponCard({ coupon }) {
    const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date()
    const isMaxed   = coupon.usedCount >= coupon.maxUses
    const pct       = Math.min(((coupon.usedCount || 0) / coupon.maxUses) * 100, 100)
    const isEditing = editId === coupon._id

    return (
      <div style={{
        background: isEditing ? 'rgba(124,58,237,0.03)' : '#fff',
        border: `1.5px solid ${isEditing ? 'rgba(124,58,237,0.25)' : '#E5E7EB'}`,
        borderRadius: '14px', padding: '13px', marginBottom: '9px',
        opacity: isExpired || isMaxed ? 0.72 : 1,
        boxShadow: isEditing
          ? '0 0 0 3px rgba(124,58,237,0.08)'
          : '0 2px 8px rgba(0,0,0,0.04)',
      }}>

        {/* Top row: code + badge */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '8px',
          marginBottom: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: '12px',
              color: isEditing ? '#7C3AED' : '#1B2A4A',
              background: isEditing ? 'rgba(124,58,237,0.08)' : 'rgba(27,42,74,0.07)',
              border: `1.5px solid ${isEditing ? 'rgba(124,58,237,0.2)' : 'rgba(27,42,74,0.12)'}`,
              padding: '3px 9px', borderRadius: '6px', letterSpacing: '0.8px',
            }}>{coupon.code}</span>
            {isEditing && (
              <span style={{
                fontSize: '9px', color: '#7C3AED', fontWeight: 700,
                background: 'rgba(124,58,237,0.08)', padding: '2px 5px', borderRadius: '4px',
              }}>editing</span>
            )}
          </div>
          <div style={{ flexShrink: 0 }}>
            {isExpired
              ? <span className="adm-badge adm-badge-red" style={{ fontSize: '10px' }}>Expired</span>
              : isMaxed
                ? <span className="adm-badge adm-badge-yellow" style={{ fontSize: '10px' }}>Maxed</span>
                : <span className="adm-badge adm-badge-green" style={{ fontSize: '10px' }}>Active</span>
            }
          </div>
        </div>

        {/* Info grid 2x2 */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '7px', marginBottom: '11px',
          padding: '9px 11px', borderRadius: '9px',
          background: 'rgba(27,42,74,0.02)', border: '1px solid #F0F1F3',
        }}>
          {/* Discount */}
          <div>
            <p style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: 700, marginBottom: '3px', textTransform: 'uppercase' }}>
              Discount
            </p>
            <span style={{
              display: 'inline-block', padding: '2px 7px', borderRadius: '5px',
              fontWeight: 700, fontSize: '11px',
              background: coupon.discountType === 'percentage'
                ? 'rgba(232,168,56,0.1)' : 'rgba(42,157,143,0.1)',
              color: coupon.discountType === 'percentage' ? '#92611A' : '#1A6B62',
            }}>
              {coupon.discountType === 'percentage'
                ? `${coupon.discountValue}% OFF`
                : `₹${coupon.discountValue} OFF`}
            </span>
          </div>

          {/* Usage */}
          <div>
            <p style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: 700, marginBottom: '3px', textTransform: 'uppercase' }}>
              Usage
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', flexShrink: 0 }}>
                {coupon.usedCount || 0}/{coupon.maxUses}
              </span>
              <div style={{ height: '4px', background: '#F3F4F6', borderRadius: '999px', overflow: 'hidden', flex: 1 }}>
                <div style={{
                  height: '100%', borderRadius: '999px', width: `${pct}%`,
                  background: pct >= 100 ? '#ef4444' : pct >= 70 ? '#F59E0B' : '#10B981',
                }} />
              </div>
            </div>
          </div>

          {/* Expiry */}
          <div>
            <p style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: 700, marginBottom: '3px', textTransform: 'uppercase' }}>
              Expiry
            </p>
            <span style={{ fontSize: '11px', fontWeight: 500, color: isExpired ? '#ef4444' : '#6B7280' }}>
              {coupon.expiryDate
                ? new Date(coupon.expiryDate).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
                : 'No expiry'}
            </span>
          </div>

          {/* Type */}
          <div>
            <p style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: 700, marginBottom: '3px', textTransform: 'uppercase' }}>
              Type
            </p>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>
              {coupon.discountType === 'percentage' ? 'Percentage' : 'Flat Amount'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '7px' }}>
          <button
            onClick={() => isEditing ? closeForm() : openEdit(coupon)}
            style={{
              flex: 1, padding: '8px 10px', borderRadius: '9px',
              border: `1.5px solid ${isEditing ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.15)'}`,
              background: isEditing ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.05)',
              color: '#7C3AED', fontWeight: 700, fontSize: '12px',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >{isEditing ? '✕ Close' : '✏️ Edit'}</button>

          <button
            onClick={() => handleDelete(coupon._id)}
            disabled={deleting === coupon._id}
            style={{
              flex: 1, padding: '8px 10px', borderRadius: '9px',
              border: '1.5px solid rgba(239,68,68,0.15)',
              background: 'rgba(239,68,68,0.05)',
              color: '#ef4444', fontWeight: 700, fontSize: '12px',
              cursor: deleting === coupon._id ? 'not-allowed' : 'pointer',
              opacity: deleting === coupon._id ? 0.5 : 1,
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            }}
          >
            {deleting === coupon._id
              ? <svg style={{ width: '10px', height: '10px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              : '🗑️'
            } Delete
          </button>
        </div>
      </div>
    )
  }

  /* ─────────────────────────────────────────
     SPINNER SVG
  ───────────────────────────────────────── */
  function Spinner({ size = 12 }) {
    return (
      <svg style={{ width: size, height: size, animation: 'spin 1s linear infinite', flexShrink: 0 }}
        fill="none" viewBox="0 0 24 24">
        <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    )
  }

  /* ═════════════════════════════════════════════
     RENDER
  ═════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position:-200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes formSlide {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes overlayIn { from{opacity:0} to{opacity:1} }
        @keyframes modalIn {
          from { opacity:0; transform:scale(0.94) translateY(10px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        *, *::before, *::after { box-sizing: border-box; }

        /* ── Page ── */
        .cp-page {
          display:flex; flex-direction:column;
          animation:fadeInUp 0.4s ease both;
        }

        /* ── Settings card ── */
        .cp-settings-card {
          background:#FFFFFF; border:1.5px solid #F0F1F3;
          overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.04);
        }
        .cp-settings-topbar {
          height:3px;
          background:linear-gradient(90deg,#1B2A4A,#E8A838,#2A9D8F);
          background-size:200% 100%; animation:shimmer 3s linear infinite;
        }

        /* ── Price preview ── */
        .cp-price-preview {
          display:flex; align-items:center; gap:12px; flex-wrap:wrap;
          background:linear-gradient(135deg,rgba(27,42,74,0.03),rgba(232,168,56,0.04));
          border:1.5px solid rgba(232,168,56,0.15); border-radius:12px;
        }
        .cp-price-badge {
          margin-left:auto; padding:4px 10px; border-radius:20px;
          background:rgba(232,168,56,0.12); border:1px solid rgba(232,168,56,0.2);
          font-size:11px; font-weight:700; color:#92611A; white-space:nowrap;
        }

        /* ── Settings inputs ── */
        .cp-settings-lbl-dot {
          display:inline-block; width:6px; height:6px; border-radius:50%;
          background:#E8A838; margin-left:5px; vertical-align:middle;
          animation:pulse 1.5s infinite;
        }

        /* ── Form card ── */
        .cp-form-wrap {
          position:relative; overflow:hidden; animation:formSlide 0.28s ease both;
        }
        .cp-form-topbar {
          position:absolute; top:0; left:0; right:0; height:3px;
          background-size:200% 100%; animation:shimmer 2.5s linear infinite;
        }
        .cp-form-topbar.create { background:linear-gradient(90deg,#1B2A4A,#E8A838,#1B2A4A); }
        .cp-form-topbar.edit   { background:linear-gradient(90deg,#8B5CF6,#EC4899,#8B5CF6); }

        .cp-mode-badge {
          display:inline-flex; align-items:center; gap:4px;
          padding:3px 9px; border-radius:20px;
          font-size:11px; font-weight:700; letter-spacing:0.3px;
        }
        .cp-mode-badge.edit   { background:rgba(139,92,246,0.1); color:#7C3AED; border:1.5px solid rgba(139,92,246,0.2); }
        .cp-mode-badge.create { background:rgba(232,168,56,0.12); color:#92611A; border:1.5px solid rgba(232,168,56,0.25); }

        .cp-change-dot {
          display:inline-block; width:6px; height:6px; border-radius:50%;
          background:#8B5CF6; margin-left:5px; vertical-align:middle;
          animation:pulse 1.5s infinite;
        }
        .cp-input-changed {
          border-color:rgba(139,92,246,0.5) !important;
          box-shadow:0 0 0 3px rgba(139,92,246,0.08) !important;
        }

        /* ── Modal ── */
        .cp-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.45);
          backdrop-filter:blur(3px); z-index:1000;
          display:flex; align-items:center; justify-content:center;
          padding:16px; animation:overlayIn 0.2s ease both;
        }
        .cp-modal {
          background:#FFFFFF; border-radius:18px;
          width:100%; max-width:400px;
          box-shadow:0 24px 60px rgba(0,0,0,0.18);
          animation:modalIn 0.3s cubic-bezier(.34,1.56,.64,1) both;
        }
        .cp-modal-cancel {
          flex:1; border-radius:11px; border:1.5px solid #E5E7EB;
          background:#F9FAFB; color:#6B7280; font-weight:600;
          cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s;
        }
        .cp-modal-cancel:hover { background:#F3F4F6; border-color:#D1D5DB; }
        .cp-modal-confirm {
          flex:1; border-radius:11px; border:none;
          color:#fff; font-weight:700;
          cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s;
          display:flex; align-items:center; justify-content:center; gap:6px;
        }
        .cp-modal-confirm:hover:not(:disabled) { transform:translateY(-1px); }
        .cp-modal-confirm:disabled { opacity:0.6; cursor:not-allowed; }

        /* ── Table ── */
        .cp-table-outer {
          background:#fff; border:1.5px solid #E5E7EB; overflow:hidden;
        }
        .cp-code-chip {
          font-family:'JetBrains Mono',monospace; font-weight:700;
          display:inline-block; letter-spacing:0.7px;
        }
        .cp-code-chip.editing { color:#7C3AED; }
        .cp-usage-bar {
          background:#F3F4F6; border-radius:999px; overflow:hidden;
        }
        .cp-usage-fill { height:100%; border-radius:999px; }

        /* ── Buttons ── */
        .cp-del {
          font-weight:600; color:#ef4444;
          background:none; border:1.5px solid transparent;
          cursor:pointer; border-radius:7px;
          transition:all 0.2s; white-space:nowrap;
          font-family:'DM Sans',sans-serif;
        }
        .cp-del:hover:not(:disabled) {
          background:rgba(239,68,68,0.07); border-color:rgba(239,68,68,0.2);
        }
        .cp-del:disabled { opacity:0.4; cursor:not-allowed; }
        .cp-edit-btn {
          font-weight:600; color:#7C3AED;
          background:none; border:1.5px solid transparent;
          cursor:pointer; border-radius:7px;
          transition:all 0.2s; white-space:nowrap;
          font-family:'DM Sans',sans-serif;
        }
        .cp-edit-btn:hover         { background:rgba(124,58,237,0.07); border-color:rgba(124,58,237,0.2); }
        .cp-edit-btn.active-edit   { background:rgba(124,58,237,0.1); border-color:rgba(124,58,237,0.3); color:#6D28D9; }

        /* ── Settings dirty banner ── */
        .cp-settings-dirty {
          display:flex; align-items:center; gap:8px;
          background:rgba(232,168,56,0.07);
          border:1.5px solid rgba(232,168,56,0.2);
          border-radius:9px; font-size:12px; color:#92611A;
          font-weight:500; flex-wrap:wrap;
        }
        .cp-dirty-banner {
          display:flex; align-items:center; gap:8px;
          background:rgba(139,92,246,0.06);
          border:1.5px solid rgba(139,92,246,0.18);
          border-radius:9px; font-size:12px;
          color:#7C3AED; font-weight:500; flex-wrap:wrap;
        }

        /* ── Settings save btn ── */
        .cp-settings-save {
          border:none; background:linear-gradient(135deg,#1B2A4A,#243656);
          color:#fff; font-weight:700;
          cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:all 0.2s; display:flex; align-items:center; gap:6px;
          box-shadow:0 4px 12px rgba(27,42,74,0.2);
        }
        .cp-settings-save:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(27,42,74,0.28); }
        .cp-settings-save:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
        .cp-settings-reset {
          border:1.5px solid #E5E7EB; background:none;
          color:#9CA3AF; font-weight:600;
          cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s;
        }
        .cp-settings-reset:hover { color:#374151; border-color:#D1D5DB; }
      `}</style>

      {/* ── Coupon Confirm Modal ── */}
      {showConfirm && (
        <div className="cp-overlay" onClick={() => setShowConfirm(false)}>
          <div className="cp-modal" style={{ padding: isMobile ? '18px 14px' : '24px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '13px', margin: '0 auto 12px',
              background: 'rgba(139,92,246,0.1)', border: '2px solid rgba(139,92,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
            }}>✏️</div>
            <p style={{
              fontFamily: 'Playfair Display,serif', fontWeight: 800,
              fontSize: isMobile ? '15px' : '17px', color: '#1A1D23',
              textAlign: 'center', marginBottom: '5px',
            }}>Confirm Update</p>
            <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', marginBottom: '16px', lineHeight: 1.5 }}>
              Review the changes below before saving.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {getChangedFields().map(ch => (
                <div key={ch.key} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 10px', background: 'rgba(27,42,74,0.03)',
                  border: '1.5px solid #F0F1F3', borderRadius: '8px', fontSize: '12px',
                }}>
                  <span style={{ fontWeight: 700, color: '#374151', minWidth: '64px', flexShrink: 0 }}>{ch.label}</span>
                  <span style={{ color: '#9CA3AF', textDecoration: 'line-through', fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.from}</span>
                  <span style={{ color: '#D1D5DB', flexShrink: 0, fontSize: '10px' }}>→</span>
                  <span style={{ fontWeight: 700, color: '#7C3AED', fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.to}</span>
                </div>
              ))}
              {getChangedFields().length === 0 && (
                <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '12px', padding: '6px 0' }}>
                  No changes detected.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="cp-modal-cancel" style={{ padding: isMobile ? '10px' : '11px', fontSize: '13px' }}
                onClick={() => setShowConfirm(false)} disabled={saving}>Go Back</button>
              <button className="cp-modal-confirm"
                style={{
                  background: 'linear-gradient(135deg,#7C3AED,#8B5CF6)',
                  boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                  padding: isMobile ? '10px' : '11px', fontSize: '13px',
                }}
                onClick={handleSave}
                disabled={saving || getChangedFields().length === 0}>
                {saving ? <Spinner /> : null}
                {saving ? 'Saving…' : '✓ Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Confirm Modal ── */}
      {showSettingsConfirm && (
        <div className="cp-overlay" onClick={() => setShowSettingsConfirm(false)}>
          <div className="cp-modal" style={{ padding: isMobile ? '18px 14px' : '24px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '13px', margin: '0 auto 12px',
              background: 'rgba(232,168,56,0.1)', border: '2px solid rgba(232,168,56,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
            }}>💰</div>
            <p style={{
              fontFamily: 'Playfair Display,serif', fontWeight: 800,
              fontSize: isMobile ? '15px' : '17px', color: '#1A1D23',
              textAlign: 'center', marginBottom: '5px',
            }}>Update Pricing</p>
            <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', marginBottom: '16px', lineHeight: 1.5 }}>
              This will affect all future subscriptions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {getSettingsChangedFields().map((ch, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 10px', background: 'rgba(27,42,74,0.03)',
                  border: '1.5px solid #F0F1F3', borderRadius: '8px', fontSize: '12px',
                }}>
                  <span style={{ fontWeight: 700, color: '#374151', minWidth: '64px', flexShrink: 0 }}>{ch.label}</span>
                  <span style={{ color: '#9CA3AF', textDecoration: 'line-through', fontSize: '11px', flex: 1 }}>{ch.from}</span>
                  <span style={{ color: '#D1D5DB', flexShrink: 0, fontSize: '10px' }}>→</span>
                  <span style={{ fontWeight: 800, color: '#E8A838', fontSize: '11px', flex: 1 }}>{ch.to}</span>
                </div>
              ))}
            </div>

            <div style={{
              padding: '9px 12px', background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px',
              fontSize: '12px', color: '#dc2626', marginBottom: '16px',
              display: 'flex', gap: '7px', lineHeight: '1.5',
            }}>
              <span>⚠️</span>
              <span>New price applies immediately to all new subscriptions.</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="cp-modal-cancel" style={{ padding: isMobile ? '10px' : '11px', fontSize: '13px' }}
                onClick={() => setShowSettingsConfirm(false)} disabled={settingsSaving}>Cancel</button>
              <button className="cp-modal-confirm"
                style={{
                  background: 'linear-gradient(135deg,#1B2A4A,#243656)',
                  boxShadow: '0 4px 14px rgba(27,42,74,0.3)',
                  padding: isMobile ? '10px' : '11px', fontSize: '13px',
                }}
                onClick={() => handleSaveSettings(true)} disabled={settingsSaving}>
                {settingsSaving ? <Spinner /> : null}
                {settingsSaving ? 'Saving…' : '✓ Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          PAGE BODY
      ════════════════════════════════════════ */}
      <div className="cp-page" style={{ gap: isMobile ? '14px' : '18px' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'Playfair Display,serif', fontWeight: 800,
              fontSize: isMobile ? '19px' : 'clamp(18px,3vw,24px)',
              color: '#1A1D23', marginBottom: '3px',
            }}>
              Coupons & Pricing
            </h1>
            <p style={{ color: '#6B7280', fontSize: '13px' }}>
              {isMobile ? 'Pricing & discount codes' : 'Manage subscription pricing and discount codes'}
              {!loading && (
                <span style={{ color: '#E8A838', fontWeight: 600, marginLeft: '6px' }}>
                  ({coupons.length})
                </span>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { fetchCoupons(); fetchSettings() }}
              disabled={loading} className="adm-btn-secondary" title="Refresh"
            >
              <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
              {!isMobile && ' Refresh'}
            </button>
            {!showForm ? (
              <button
                onClick={() => { setShowForm(true); setEditId(null); setOrigForm(null); setForm(EMPTY_FORM) }}
                className="adm-btn-primary"
              >
                + {isMobile ? 'New' : 'Create Coupon'}
              </button>
            ) : (
              <button onClick={closeForm} className="adm-btn-secondary">✕ Cancel</button>
            )}
          </div>
        </div>

        {/* ════════════
            SETTINGS CARD
        ════════════ */}
        <div className="cp-settings-card" style={{ borderRadius: isMobile ? '14px' : '16px' }}>
          <div className="cp-settings-topbar" />
          <div style={{ padding: isMobile ? '14px' : '20px' }}>

            {/* Header row */}
            <div style={{
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'space-between', gap: '10px',
              flexWrap: 'wrap', marginBottom: '14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg,#1B2A4A,#243656)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', flexShrink: 0,
                }}>💰</div>
                <div>
                  <h2 style={{ fontWeight: 800, color: '#1A1D23', fontSize: '14px', marginBottom: '2px' }}>
                    Subscription Pricing
                  </h2>
                  <p style={{ fontSize: '11px', color: '#9CA3AF' }}>
                    {isMobile ? 'Checkout price' : 'Controls price on premium page & checkout'}
                  </p>
                </div>
              </div>
              {/* Live badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '4px 10px', background: 'rgba(22,163,74,0.08)',
                border: '1px solid rgba(22,163,74,0.15)', borderRadius: '20px', flexShrink: 0,
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a',
                  boxShadow: '0 0 5px rgba(22,163,74,0.5)', animation: 'pulse 2s infinite',
                  display: 'inline-block',
                }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>Live</span>
              </div>
            </div>

            {/* Price preview */}
            {!settingsLoading && (
              <div className="cp-price-preview" style={{ padding: isMobile ? '11px 12px' : '13px 15px', marginBottom: '14px' }}>
                <div>
                  <div style={{
                    fontFamily: 'Playfair Display,serif', fontWeight: 800,
                    fontSize: isMobile ? '22px' : '26px', color: '#1B2A4A', lineHeight: 1,
                  }}>₹{settings.subscriptionPrice}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>
                    per {settings.subscriptionMonths} months
                  </div>
                </div>
                <div style={{ flex: 1, borderLeft: '1px solid rgba(27,42,74,0.08)', paddingLeft: '11px', marginLeft: '4px' }}>
                  <p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px' }}>Monthly</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#E8A838' }}>
                    ₹{Math.round(settings.subscriptionPrice / settings.subscriptionMonths)}/mo
                  </p>
                </div>
                {!isMobile && <div className="cp-price-badge">⭐ Active</div>}
              </div>
            )}

            {/* Dirty banner */}
            {isSettingsDirty && (
              <div className="cp-settings-dirty" style={{ padding: '8px 11px', marginBottom: '12px' }}>
                <span>💡</span>
                <span style={{ fontSize: '12px' }}>
                  Unsaved — click <strong>Save Pricing</strong> to apply.
                </span>
              </div>
            )}

            {/* Inputs */}
            {settingsLoading ? (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                {[1, 2].map(i => (
                  <div key={i} style={{
                    flex: 1, height: '42px', borderRadius: '9px',
                    background: 'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)',
                    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
                  }} />
                ))}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? '10px' : '12px',
                marginBottom: '12px',
              }}>
                {/* Price input */}
                <div>
                  <label style={{
                    display: 'block', fontSize: '11px', color: '#1B2A4A',
                    marginBottom: '5px', fontWeight: 700, letterSpacing: '0.3px',
                  }}>
                    Price (₹)
                    {settings.subscriptionPrice !== origSettings.subscriptionPrice && (
                      <span className="cp-settings-lbl-dot" />
                    )}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)',
                      fontWeight: 700, color: '#1B2A4A', fontSize: '13px', pointerEvents: 'none',
                    }}>₹</span>
                    <input
                      type="number"
                      style={{
                        width: '100%', padding: '10px 12px 10px 25px',
                        borderRadius: '9px',
                        border: `1.5px solid ${settings.subscriptionPrice !== origSettings.subscriptionPrice ? 'rgba(232,168,56,0.5)' : '#E5E7EB'}`,
                        fontSize: '14px', fontWeight: 700, color: '#1A1D23',
                        fontFamily: 'DM Sans,sans-serif',
                        background: settings.subscriptionPrice !== origSettings.subscriptionPrice
                          ? 'rgba(232,168,56,0.03)' : '#FAFAFA',
                        outline: 'none',
                        transition: 'border 0.2s, box-shadow 0.2s',
                      }}
                      value={settings.subscriptionPrice}
                      onChange={e => setSettings(s => ({ ...s, subscriptionPrice: parseInt(e.target.value) || 0 }))}
                      min={1} max={100000} disabled={settingsSaving}
                    />
                  </div>
                  <p style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px' }}>Min ₹1 • Max ₹1,00,000</p>
                </div>

                {/* Duration input */}
                <div>
                  <label style={{
                    display: 'block', fontSize: '11px', color: '#1B2A4A',
                    marginBottom: '5px', fontWeight: 700, letterSpacing: '0.3px',
                  }}>
                    Duration (months)
                    {settings.subscriptionMonths !== origSettings.subscriptionMonths && (
                      <span className="cp-settings-lbl-dot" />
                    )}
                  </label>
                  <input
                    type="number"
                    style={{
                      width: '100%', padding: '10px 12px',
                      borderRadius: '9px',
                      border: `1.5px solid ${settings.subscriptionMonths !== origSettings.subscriptionMonths ? 'rgba(232,168,56,0.5)' : '#E5E7EB'}`,
                      fontSize: '14px', fontWeight: 700, color: '#1A1D23',
                      fontFamily: 'DM Sans,sans-serif',
                      background: settings.subscriptionMonths !== origSettings.subscriptionMonths
                        ? 'rgba(232,168,56,0.03)' : '#FAFAFA',
                      outline: 'none',
                    }}
                    value={settings.subscriptionMonths}
                    onChange={e => setSettings(s => ({ ...s, subscriptionMonths: parseInt(e.target.value) || 0 }))}
                    min={1} max={24} disabled={settingsSaving}
                  />
                  <p style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px' }}>Min 1 • Max 24 months</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleSaveSettings(false)}
                disabled={settingsSaving || !isSettingsDirty || settingsLoading}
                className="cp-settings-save"
                style={{
                  padding: isMobile ? '8px 14px' : '9px 18px',
                  borderRadius: '10px', fontSize: '13px',
                  opacity: (!isSettingsDirty || settingsLoading) ? 0.5 : 1,
                }}
              >
                {settingsSaving ? <Spinner /> : <span>💾</span>}
                {settingsSaving ? 'Saving…' : 'Save Pricing'}
              </button>

              {isSettingsDirty && (
                <button
                  onClick={() => setSettings(origSettings)}
                  disabled={settingsSaving}
                  className="cp-settings-reset"
                  style={{ padding: isMobile ? '8px 12px' : '9px 14px', borderRadius: '10px', fontSize: '13px' }}
                >↺ Reset</button>
              )}

              {isDesktop && (
                <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ℹ️ Applies to new subscriptions only
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ════════════
            COUPON FORM
        ════════════ */}
        {showForm && (
          <div className="adm-card cp-form-wrap" style={{
            paddingTop: '24px',
            borderRadius: isMobile ? '14px' : '16px',
          }}>
            <div className={`cp-form-topbar ${editId ? 'edit' : 'create'}`} />

            {/* Form header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <p style={{ fontWeight: 700, color: '#1A1D23', fontSize: '14px', margin: 0 }}>
                {editId ? '✏️ Edit Coupon' : '🎟️ Create Coupon'}
              </p>
              <span className={`cp-mode-badge ${editId ? 'edit' : 'create'}`}>
                {editId ? '● Editing' : '● New'}
              </span>
              {editId && isDirty && (
                <span style={{
                  fontSize: '11px', color: '#7C3AED', fontWeight: 600,
                  marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <span className="cp-change-dot" />
                  Unsaved
                </span>
              )}
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Form grid — responsive */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? '1fr 1fr'
                  : isTablet
                    ? 'repeat(3, 1fr)'
                    : 'repeat(5, 1fr)',
                gap: isMobile ? '10px' : '12px',
              }}>

                {/* Code — full width on mobile */}
                <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
                  <label style={{
                    display: 'block', fontSize: '11px', color: '#1B2A4A',
                    marginBottom: '5px', fontWeight: 700, letterSpacing: '0.3px',
                  }}>
                    Code <span style={{ color: '#E8A838' }}>*</span>
                    {editId && form.code !== origForm?.code && <span className="cp-change-dot" />}
                  </label>
                  <input
                    type="text" placeholder="e.g. SAVE20"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className={`adm-input ${editId && form.code !== origForm?.code ? 'cp-input-changed' : ''}`}
                    style={{ fontFamily: 'JetBrains Mono,monospace', letterSpacing: '1px' }}
                    required disabled={saving}
                  />
                </div>

                {/* Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#1B2A4A', marginBottom: '5px', fontWeight: 700 }}>
                    Type
                    {editId && form.discountType !== origForm?.discountType && <span className="cp-change-dot" />}
                  </label>
                  <select
                    value={form.discountType}
                    onChange={e => setForm({ ...form, discountType: e.target.value })}
                    className={`adm-input ${editId && form.discountType !== origForm?.discountType ? 'cp-input-changed' : ''}`}
                    disabled={saving}
                  >
                    <option value="percentage">% Off</option>
                    <option value="flat">₹ Flat</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#1B2A4A', marginBottom: '5px', fontWeight: 700 }}>
                    Value <span style={{ color: '#E8A838' }}>*</span>
                    {editId && form.discountValue !== origForm?.discountValue && <span className="cp-change-dot" />}
                  </label>
                  <input
                    type="number"
                    placeholder={form.discountType === 'percentage' ? '20' : '100'}
                    value={form.discountValue}
                    onChange={e => setForm({ ...form, discountValue: e.target.value })}
                    className={`adm-input ${editId && form.discountValue !== origForm?.discountValue ? 'cp-input-changed' : ''}`}
                    min={1} max={form.discountType === 'percentage' ? 100 : undefined}
                    required disabled={saving}
                  />
                </div>

                {/* Max Uses */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#1B2A4A', marginBottom: '5px', fontWeight: 700 }}>
                    Max Uses
                    {editId && String(form.maxUses) !== String(origForm?.maxUses) && <span className="cp-change-dot" />}
                  </label>
                  <input
                    type="number" value={form.maxUses}
                    onChange={e => setForm({ ...form, maxUses: e.target.value })}
                    className={`adm-input ${editId && String(form.maxUses) !== String(origForm?.maxUses) ? 'cp-input-changed' : ''}`}
                    min={1} disabled={saving}
                  />
                </div>

                {/* Expiry */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#1B2A4A', marginBottom: '5px', fontWeight: 700 }}>
                    Expiry
                    {editId && form.expiryDate !== origForm?.expiryDate && <span className="cp-change-dot" />}
                  </label>
                  <input
                    type="date" value={form.expiryDate}
                    onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                    className={`adm-input ${editId && form.expiryDate !== origForm?.expiryDate ? 'cp-input-changed' : ''}`}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Dirty banner */}
              {editId && isDirty && (
                <div className="cp-dirty-banner" style={{ padding: '8px 11px' }}>
                  <span>✏️</span>
                  <span>
                    <strong>{getChangedFields().length} field{getChangedFields().length !== 1 ? 's' : ''}</strong> changed
                    — click <strong>Update</strong> to confirm.
                  </span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={saving || (editId && !isDirty)}
                  className="adm-btn-primary"
                  style={{
                    padding: '10px 18px',
                    display: 'flex', alignItems: 'center', gap: '7px',
                    ...(editId ? {
                      background: 'linear-gradient(135deg,#7C3AED,#8B5CF6)',
                      boxShadow: '0 4px 14px rgba(124,58,237,0.25)',
                    } : {}),
                    opacity: (editId && !isDirty) ? 0.5 : 1,
                    ...(isMobile ? { flex: 1, justifyContent: 'center' } : {}),
                  }}
                >
                  {saving
                    ? <><Spinner size={13} />{editId ? 'Updating…' : 'Creating…'}</>
                    : editId ? '✏️ Update' : '+ Create'
                  }
                </button>

                <button type="button" onClick={closeForm} disabled={saving} className="adm-btn-secondary">
                  Cancel
                </button>

                {editId && isDirty && (
                  <button
                    type="button"
                    onClick={() => { setForm(origForm); setShowConfirm(false) }}
                    disabled={saving}
                    style={{
                      padding: '10px 12px', borderRadius: '11px',
                      border: '1.5px solid #E5E7EB', background: 'none',
                      color: '#9CA3AF', fontWeight: 600, fontSize: '13px',
                      cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
                    }}
                  >↺ Reset</button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ════════════
            TABLE / CARDS
        ════════════ */}
        {isMobile ? (

          /* ── MOBILE: Cards ── */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D23' }}>
                All Coupons
                <span style={{ color: '#E8A838', marginLeft: '5px', fontWeight: 600 }}>({coupons.length})</span>
              </h3>
            </div>

            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{
                  height: '158px', borderRadius: '14px', marginBottom: '9px',
                  background: 'linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)',
                  backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
                }} />
              ))
            ) : coupons.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 16px',
                background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: '14px',
              }}>
                <div style={{ fontSize: '38px', marginBottom: '10px' }}>🎟️</div>
                <p style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 500 }}>No coupons yet</p>
                <p style={{ color: '#C4C9D4', fontSize: '12px', marginTop: '4px' }}>
                  Create your first discount code above.
                </p>
              </div>
            ) : (
              coupons.map(coupon => <MobileCouponCard key={coupon._id} coupon={coupon} />)
            )}
          </div>

        ) : (

          /* ── TABLET / DESKTOP: Table ── */
          <div className="cp-table-outer" style={{ borderRadius: '14px' }}>
            {loading ? (
              <div className="adm-spinner">
                <svg style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite', color: '#E8A838', marginBottom: '8px' }}
                  fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Loading coupons…</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="adm-table" style={{ minWidth: isTablet ? '540px' : '600px' }}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Discount</th>
                      <th>Usage</th>
                      {isDesktop && <th>Expiry</th>}
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan={isDesktop ? 6 : 5}>
                          <div className="adm-empty">
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎟️</div>
                            <p style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 500 }}>No coupons yet.</p>
                            <p style={{ color: '#C4C9D4', fontSize: '12px', marginTop: '4px' }}>
                              Create your first discount code above.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : coupons.map(coupon => {
                      const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date()
                      const isMaxed   = coupon.usedCount >= coupon.maxUses
                      const pct       = Math.min(((coupon.usedCount || 0) / coupon.maxUses) * 100, 100)
                      const isEditing = editId === coupon._id

                      return (
                        <tr key={coupon._id} style={{
                          opacity: isExpired || isMaxed ? 0.62 : 1,
                          background: isEditing ? 'rgba(124,58,237,0.03)' : undefined,
                          outline: isEditing ? '2px solid rgba(124,58,237,0.14)' : undefined,
                          outlineOffset: '-2px',
                        }}>

                          {/* Code */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                              <span className={`cp-code-chip ${isEditing ? 'editing' : ''}`} style={{
                                background: isEditing ? 'rgba(124,58,237,0.08)' : 'rgba(27,42,74,0.07)',
                                border: `1.5px solid ${isEditing ? 'rgba(124,58,237,0.2)' : 'rgba(27,42,74,0.12)'}`,
                                padding: isTablet ? '2px 7px' : '3px 9px',
                                borderRadius: '6px',
                                fontSize: isTablet ? '10px' : '11px',
                                color: isEditing ? '#7C3AED' : '#1B2A4A',
                              }}>{coupon.code}</span>
                              {isEditing && isDesktop && (
                                <span style={{
                                  fontSize: '9px', color: '#7C3AED', fontWeight: 700,
                                  background: 'rgba(124,58,237,0.08)', padding: '1px 5px', borderRadius: '3px',
                                }}>editing</span>
                              )}
                            </div>
                          </td>

                          {/* Discount */}
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                              fontWeight: 700, fontSize: '11px',
                              background: coupon.discountType === 'percentage'
                                ? 'rgba(232,168,56,0.1)' : 'rgba(42,157,143,0.1)',
                              color: coupon.discountType === 'percentage' ? '#92611A' : '#1A6B62',
                            }}>
                              {coupon.discountType === 'percentage'
                                ? `${coupon.discountValue}%`
                                : `₹${coupon.discountValue}`}
                              {isDesktop && ' OFF'}
                            </span>
                          </td>

                          {/* Usage */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: '#6B7280', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                {coupon.usedCount || 0}/{coupon.maxUses}
                              </span>
                              <div className="cp-usage-bar" style={{ height: '4px', width: isTablet ? '36px' : '46px' }}>
                                <div className="cp-usage-fill" style={{
                                  width: `${pct}%`, height: '100%',
                                  background: pct >= 100 ? '#ef4444' : pct >= 70 ? '#F59E0B' : '#10B981',
                                }} />
                              </div>
                            </div>
                          </td>

                          {/* Expiry — desktop only */}
                          {isDesktop && (
                            <td>
                              {coupon.expiryDate ? (
                                <span style={{
                                  background: isExpired ? 'rgba(239,68,68,0.07)' : 'rgba(27,42,74,0.05)',
                                  color: isExpired ? '#ef4444' : '#6B7280',
                                  padding: '2px 7px', borderRadius: '5px', fontSize: '11px', fontWeight: 500,
                                }}>
                                  {new Date(coupon.expiryDate).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                  })}
                                </span>
                              ) : (
                                <span style={{ color: '#D1D5DB', fontSize: '11px' }}>No expiry</span>
                              )}
                            </td>
                          )}

                          {/* Status */}
                          <td>
                            {isExpired
                              ? <span className="adm-badge adm-badge-red" style={{ fontSize: '10px' }}>● Expired</span>
                              : isMaxed
                                ? <span className="adm-badge adm-badge-yellow" style={{ fontSize: '10px' }}>● Maxed</span>
                                : <span className="adm-badge adm-badge-green" style={{ fontSize: '10px' }}>● Active</span>
                            }
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => isEditing ? closeForm() : openEdit(coupon)}
                                className={`cp-edit-btn ${isEditing ? 'active-edit' : ''}`}
                                style={{ fontSize: '11px', padding: isTablet ? '4px 7px' : '5px 8px' }}
                              >
                                {isEditing ? '✕' : '✏️'}
                              </button>
                              <button
                                onClick={() => handleDelete(coupon._id)}
                                disabled={deleting === coupon._id}
                                className="cp-del"
                                style={{ fontSize: '11px', padding: isTablet ? '4px 7px' : '5px 8px' }}
                              >
                                {deleting === coupon._id
                                  ? <svg style={{ width: '10px', height: '10px', animation: 'spin 1s linear infinite', display: 'inline-block' }} fill="none" viewBox="0 0 24 24">
                                      <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                      <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                    </svg>
                                  : '🗑️'
                                }
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  )
}