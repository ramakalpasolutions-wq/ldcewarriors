// src/app/admin/users/page.js
'use client'
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const [users,           setUsers          ] = useState([])
  const [loading,         setLoading        ] = useState(true)
  const [search,          setSearch         ] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [filter,          setFilter         ] = useState('all')
  const [pagination,      setPagination     ] = useState({ page:1, limit:20, total:0, pages:0 })
  const [actionLoading,   setActionLoading  ] = useState(null)
  const [selectedUser,    setSelectedUser   ] = useState(null)
  const [detailLoading,   setDetailLoading  ] = useState(false)
  const [userDetail,      setUserDetail     ] = useState(null)
  const [isMobile,        setIsMobile       ] = useState(false)
  const [isTablet,        setIsTablet       ] = useState(false)

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page:page.toString(), limit:'20' })
      if (searchDebounced) params.set('search', searchDebounced)
      const res  = await fetch(`/api/admin/users?${params}`, { credentials:'include' })
      const data = await res.json()
      if (data.success) { setUsers(data.users || []); setPagination(data.pagination) }
      else toast.error(data.error || 'Failed to load users')
    } catch { toast.error('Failed to fetch users') }
    setLoading(false)
  }, [searchDebounced])

  useEffect(() => { fetchUsers(1) }, [fetchUsers])

  async function openDetail(user) {
    setSelectedUser(user); setUserDetail(null); setDetailLoading(true)
    try {
      const res  = await fetch(`/api/admin/users/${user._id}`, { credentials:'include' })
      const data = await res.json()
      if (data.success) setUserDetail(data.user)
      else toast.error(data.error || 'Failed to load user detail')
    } catch { toast.error('Failed to load user detail') }
    setDetailLoading(false)
  }

  function closeDetail() { setSelectedUser(null); setUserDetail(null) }

  const filtered = users.filter(u => {
    if (filter==='subscribed') return u.subscription?.status==='active'
    if (filter==='blocked')    return !u.isActive
    if (filter==='unverified') return !u.isEmailVerified || !u.isMobileVerified
    return true
  })

  const stats = {
    total:      pagination.total,
    premium:    users.filter(u => u.subscription?.status==='active').length,
    blocked:    users.filter(u => !u.isActive).length,
    unverified: users.filter(u => !u.isEmailVerified || !u.isMobileVerified).length,
  }

  async function handleAction(userId, action, e) {
    e?.stopPropagation()
    setActionLoading(`${userId}-${action}`)
    try {
      const res  = await fetch('/api/admin/users', {
        method:'PATCH', credentials:'include',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ id:userId, action }),
      })
      const data = await res.json()
      if (data.success) {
        if (action==='block') {
          setUsers(prev => prev.map(u => u._id===userId ? { ...u, isActive:false } : u))
          if (selectedUser?._id===userId) { setSelectedUser(p => ({ ...p, isActive:false })); setUserDetail(p => p ? { ...p, isActive:false } : p) }
          toast.success('User blocked')
        } else if (action==='unblock') {
          setUsers(prev => prev.map(u => u._id===userId ? { ...u, isActive:true } : u))
          if (selectedUser?._id===userId) { setSelectedUser(p => ({ ...p, isActive:true })); setUserDetail(p => p ? { ...p, isActive:true } : p) }
          toast.success('User unblocked')
        } else if (action==='reset-device') { toast.success('Device session reset') }
      } else toast.error(data.error || 'Action failed')
    } catch { toast.error('Failed to perform action') }
    setActionLoading(null)
  }

  const FILTER_TABS = [
    { id:'all',        label:'All'        },
    { id:'subscribed', label:'Premium'    },
    { id:'blocked',    label:'Blocked'    },
    { id:'unverified', label:'Unverified' },
  ]

  const STATS_ROW = [
    { label:'Total Users', value:stats.total,      accent:'#3b82f6' },
    { label:'Premium',     value:stats.premium,    accent:'#f59e0b' },
    { label:'Blocked',     value:stats.blocked,    accent:'#ef4444' },
    { label:'Unverified',  value:stats.unverified, accent:'#f97316' },
  ]

  const statCols = isMobile ? '1fr 1fr' : isTablet ? '1fr 1fr' : 'repeat(4,1fr)'

  return (
    <>
      <style>{`
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes drawerIn  { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
        @keyframes overlayIn { from{opacity:0} to{opacity:1} }

        .usr-page { display:flex; flex-direction:column; gap:${isMobile ? '14px' : '24px'}; animation:fadeInUp 0.4s ease both; }

        .usr-skel { background:linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%); background-size:200% 100%; border-radius:8px; animation:shimmer 1.4s infinite; }

        .usr-stat-card { background:#FFFFFF; border:1.5px solid #F0F1F3; border-radius:${isMobile ? '14px' : '16px'}; padding:${isMobile ? '12px 14px' : '16px 18px'}; transition:transform 0.25s,box-shadow 0.25s; box-shadow:0 2px 8px rgba(0,0,0,0.03); position:relative; overflow:hidden; }
        .usr-stat-card:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,0.07); }

        .usr-flt-btn { padding:${isMobile ? '6px 10px' : '7px 16px'}; border-radius:10px; font-size:${isMobile ? '11px' : '12px'}; font-weight:600; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.22s; white-space:nowrap; }
        .usr-flt-btn.active { background:linear-gradient(135deg,#1B2A4A,#243656); color:#fff; box-shadow:0 4px 12px rgba(27,42,74,0.25); }
        .usr-flt-btn.inactive { background:rgba(255,255,255,0.85); border:1.5px solid #E5E7EB; color:#6B7280; }
        .usr-flt-btn.inactive:hover { color:#1B2A4A; border-color:rgba(27,42,74,0.2); }

        .usr-act-btn { font-size:11px; font-weight:600; background:none; border:1.5px solid transparent; cursor:pointer; padding:4px 10px; border-radius:7px; transition:all 0.2s; font-family:'DM Sans',sans-serif; white-space:nowrap; }
        .usr-act-btn:disabled { opacity:.4; cursor:not-allowed; }
        .usr-act-btn.reset:hover:not(:disabled) { background:rgba(107,114,128,0.08); border-color:rgba(107,114,128,0.2); }
        .usr-act-btn.block { color:#ef4444; }
        .usr-act-btn.block:hover:not(:disabled) { background:rgba(239,68,68,0.07); border-color:rgba(239,68,68,0.2); }
        .usr-act-btn.unblock { color:#16a34a; }
        .usr-act-btn.unblock:hover:not(:disabled) { background:rgba(22,163,74,0.07); border-color:rgba(22,163,74,0.2); }

        .usr-row { cursor:pointer; transition:background 0.18s; }
        .usr-row:hover { background:rgba(27,42,74,0.025) !important; }
        .usr-row.selected { background:rgba(232,168,56,0.05) !important; }

        .usr-pg-btn { width:34px; height:34px; border-radius:9px; font-size:12px; font-weight:600; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
        .usr-pg-btn.active { background:linear-gradient(135deg,#1B2A4A,#243656); color:#fff; box-shadow:0 4px 10px rgba(27,42,74,0.25); }
        .usr-pg-btn.inactive { background:rgba(255,255,255,0.85); border:1.5px solid #E5E7EB; color:#6B7280; }
        .usr-pg-btn.inactive:hover { color:#1B2A4A; border-color:rgba(27,42,74,0.2); }
        .usr-pg-nav { padding:7px 14px; border-radius:9px; background:rgba(255,255,255,0.85); border:1.5px solid #E5E7EB; color:#6B7280; font-size:12px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
        .usr-pg-nav:hover:not(:disabled) { color:#1B2A4A; border-color:rgba(27,42,74,0.2); }
        .usr-pg-nav:disabled { opacity:.35; cursor:not-allowed; }

        .usr-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.35); backdrop-filter:blur(2px); z-index:900; animation:overlayIn 0.25s ease both; }
        .usr-drawer { position:fixed; top:0; right:0; bottom:0; width:min(${isMobile ? '100vw' : '480px'},100vw); background:#FFFFFF; z-index:901; display:flex; flex-direction:column; box-shadow:-8px 0 40px rgba(0,0,0,0.12); animation:drawerIn 0.35s cubic-bezier(.34,1.56,.64,1) both; overflow:hidden; }

        .usr-drawer-hd { padding:${isMobile ? '16px' : '20px 22px 16px'}; border-bottom:1.5px solid #F0F1F3; display:flex; align-items:center; gap:${isMobile ? '10px' : '14px'}; flex-shrink:0; background:linear-gradient(135deg,#1B2A4A 0%,#243656 100%); }
        .usr-drawer-body { flex:1; overflow-y:auto; overscroll-behavior:contain; padding:${isMobile ? '14px' : '20px 22px'}; display:flex; flex-direction:column; gap:${isMobile ? '14px' : '20px'}; }
        .usr-drawer-body::-webkit-scrollbar { width:4px; }
        .usr-drawer-body::-webkit-scrollbar-track { background:#F9FAFB; }
        .usr-drawer-body::-webkit-scrollbar-thumb { background:#E5E7EB; border-radius:4px; }
        .usr-drawer-ft { padding:${isMobile ? '10px 14px' : '14px 22px'}; border-top:1.5px solid #F0F1F3; display:flex; gap:8px; flex-shrink:0; background:#FAFAFA; flex-wrap:wrap; }

        .usr-detail-section { background:#FAFAFA; border:1.5px solid #F0F1F3; border-radius:14px; overflow:hidden; }
        .usr-detail-section-hd { padding:11px 14px; background:rgba(27,42,74,0.04); border-bottom:1.5px solid #F0F1F3; font-size:11px; font-weight:800; color:#6B7280; text-transform:uppercase; letter-spacing:0.7px; display:flex; align-items:center; gap:6px; }
        .usr-detail-row { display:flex; align-items:flex-start; gap:10px; padding:${isMobile ? '8px 12px' : '10px 14px'}; border-bottom:1px solid #F3F4F6; transition:background 0.15s; }
        .usr-detail-row:last-child { border-bottom:none; }
        .usr-detail-row:hover { background:rgba(27,42,74,0.02); }
        .usr-detail-key { font-size:${isMobile ? '10px' : '11px'}; color:#9CA3AF; font-weight:600; min-width:${isMobile ? '90px' : '110px'}; flex-shrink:0; padding-top:1px; }
        .usr-detail-val { font-size:${isMobile ? '11px' : '12px'}; color:#1A1D23; font-weight:500; flex:1; word-break:break-all; }
        .usr-detail-val.mono { font-family:'JetBrains Mono',monospace; font-size:${isMobile ? '10px' : '11px'}; color:#374151; }

        .usr-skel-line { background:linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%); background-size:200% 100%; border-radius:6px; animation:shimmer 1.4s infinite; height:12px; }

        .usr-play-row { display:flex; align-items:center; gap:10px; padding:${isMobile ? '8px 12px' : '9px 14px'}; border-bottom:1px solid #F3F4F6; transition:background 0.15s; }
        .usr-play-row:last-child { border-bottom:none; }
        .usr-sub-row { display:flex; flex-direction:column; gap:4px; padding:${isMobile ? '8px 12px' : '10px 14px'}; border-bottom:1px solid #F3F4F6; }
        .usr-sub-row:last-child { border-bottom:none; }

        /* Mobile user card */
        .usr-mob-card { background:#FFFFFF; border:1.5px solid #F0F1F3; border-radius:14px; padding:12px; transition:border-color .2s; cursor:pointer; }
        .usr-mob-card:hover { border-color:rgba(232,168,56,0.3); }
        .usr-mob-card.selected { border-color:rgba(232,168,56,0.5); background:rgba(232,168,56,0.03); }

        /* Filter scroll */
        .usr-filter-track { overflow-x:auto; scrollbar-width:none; -webkit-overflow-scrolling:touch; flex:1; }
        .usr-filter-track::-webkit-scrollbar { display:none; }
        .usr-filter-inner { display:flex; gap:6px; width:max-content; }
      `}</style>

      {/* Drawer */}
      {selectedUser && (
        <>
          <div className="usr-overlay" onClick={closeDetail}/>
          <aside className="usr-drawer">
            <div className="usr-drawer-hd">
              <div style={{ width:isMobile ? '42px' : '52px', height:isMobile ? '42px' : '52px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:isMobile ? '16px' : '20px', fontWeight:800, flexShrink:0, border:'2px solid rgba(255,255,255,0.2)', color:'#E8A838', background:'rgba(255,255,255,0.1)' }}>
                {selectedUser.fullName?.charAt(0) || '?'}
              </div>
              <div style={{ minWidth:0, flex:1 }}>
                <p style={{ color:'#FFFFFF', fontWeight:700, fontSize:isMobile ? '14px' : '15px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {selectedUser.fullName}
                </p>
                <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px', marginTop:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {selectedUser.email}
                </p>
                <div style={{ display:'flex', gap:'6px', marginTop:'5px', flexWrap:'wrap' }}>
                  {selectedUser.subscription?.status==='active' && (
                    <span style={{ background:'rgba(232,168,56,0.2)', color:'#E8A838', border:'1px solid rgba(232,168,56,0.3)', fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'20px' }}>⭐ Premium</span>
                  )}
                  {!selectedUser.isActive && (
                    <span style={{ background:'rgba(239,68,68,0.2)', color:'#FCA5A5', border:'1px solid rgba(239,68,68,0.3)', fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'20px' }}>🚫 Blocked</span>
                  )}
                </div>
              </div>
              <button onClick={closeDetail} style={{ marginLeft:'auto', width:'30px', height:'30px', borderRadius:'9px', background:'rgba(255,255,255,0.12)', border:'1.5px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.8)', fontSize:'15px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
            </div>

            <div className="usr-drawer-body">
              {detailLoading ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                  {[1,2,3].map(i => (
                    <div key={i} className="usr-detail-section">
                      <div className="usr-detail-section-hd"><div className="usr-skel-line" style={{ width:'80px' }}/></div>
                      {[1,2,3].map(j => (
                        <div key={j} className="usr-detail-row">
                          <div className="usr-skel-line" style={{ width:'80px', flexShrink:0 }}/>
                          <div className="usr-skel-line" style={{ flex:1 }}/>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : userDetail ? (
                <>
                  <div className="usr-detail-section">
                    <div className="usr-detail-section-hd">👤 Personal Information</div>
                    {[
                      { k:'Full Name', v:userDetail.fullName },
                      { k:'Email',     v:userDetail.email },
                      { k:'Mobile',    v:userDetail.mobile },
                      { k:'User ID',   v:userDetail._id, mono:true },
                      { k:'Joined',    v:new Date(userDetail.createdAt).toLocaleDateString('en-IN',{ day:'numeric', month:'long', year:'numeric' }) },
                    ].map(r => (
                      <div key={r.k} className="usr-detail-row">
                        <span className="usr-detail-key">{r.k}</span>
                        <span className={`usr-detail-val ${r.mono ? 'mono' : ''}`}>{r.v || '—'}</span>
                      </div>
                    ))}
                  </div>

                  <div className="usr-detail-section">
                    <div className="usr-detail-section-hd">🔐 Verification & Status</div>
                    {[
                      { k:'Email',   v:userDetail.isEmailVerified  ? <span style={{ color:'#16a34a', fontWeight:700 }}>✓ Verified</span>   : <span style={{ color:'#dc2626', fontWeight:700 }}>✗ Not Verified</span> },
                      { k:'Mobile',  v:userDetail.isMobileVerified ? <span style={{ color:'#16a34a', fontWeight:700 }}>✓ Verified</span>   : <span style={{ color:'#dc2626', fontWeight:700 }}>✗ Not Verified</span> },
                      { k:'Account', v:userDetail.isActive         ? <span style={{ color:'#16a34a', fontWeight:700 }}>● Active</span>     : <span style={{ color:'#dc2626', fontWeight:700 }}>● Blocked</span> },
                      { k:'Device',  v:userDetail.deviceId         ? <span style={{ color:'#1B2A4A', fontWeight:600 }}>📱 Bound</span>     : <span style={{ color:'#9CA3AF' }}>No device</span> },
                      { k:'Device ID', v:userDetail.deviceId || '—', mono:true },
                    ].map(r => (
                      <div key={r.k} className="usr-detail-row">
                        <span className="usr-detail-key">{r.k}</span>
                        <span className={`usr-detail-val ${r.mono ? 'mono' : ''}`}>{r.v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="usr-detail-section">
                    <div className="usr-detail-section-hd">
                      💳 Subscription History
                      <span style={{ marginLeft:'auto', background:'rgba(27,42,74,0.08)', borderRadius:'6px', padding:'1px 7px', fontSize:'10px', fontWeight:700, color:'#374151' }}>
                        {userDetail.subscriptions?.length || 0}
                      </span>
                    </div>
                    {userDetail.subscriptions?.length ? userDetail.subscriptions.map((sub, i) => (
                      <div key={i} className="usr-sub-row">
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                          <span className={`adm-badge ${sub.status==='active' ? 'adm-badge-green' : sub.status==='pending' ? 'adm-badge-yellow' : 'adm-badge-gray'}`}>
                            {sub.status==='active' ? '● Active' : sub.status}
                          </span>
                          <span style={{ fontWeight:700, color:'#1A1D23', fontSize:'13px' }}>₹{sub.amount}</span>
                          {sub.couponCode && (
                            <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'10px', color:'#7C3AED', background:'rgba(124,58,237,0.07)', border:'1px solid rgba(124,58,237,0.15)', padding:'1px 6px', borderRadius:'5px' }}>
                              {sub.couponCode}
                            </span>
                          )}
                        </div>
                        <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginTop:'3px' }}>
                          {sub.startDate && <span style={{ fontSize:'11px', color:'#9CA3AF' }}>Start: {new Date(sub.startDate).toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' })}</span>}
                          {sub.endDate   && <span style={{ fontSize:'11px', color:'#9CA3AF' }}>End: {new Date(sub.endDate).toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' })}</span>}
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding:'14px', textAlign:'center' }}>
                        <p style={{ color:'#9CA3AF', fontSize:'12px' }}>No subscriptions yet</p>
                      </div>
                    )}
                  </div>

                  <div className="usr-detail-section">
                    <div className="usr-detail-section-hd">
                      🎬 Video Play History
                      <span style={{ marginLeft:'auto', background:'rgba(27,42,74,0.08)', borderRadius:'6px', padding:'1px 7px', fontSize:'10px', fontWeight:700, color:'#374151' }}>
                        {userDetail.videoPlays?.length || 0}
                      </span>
                    </div>
                    {userDetail.videoPlays?.length ? userDetail.videoPlays.map((vp, i) => (
                      <div key={i} className="usr-play-row">
                        {vp.video?.thumbnail ? (
                          <img src={vp.video.thumbnail} alt="" style={{ width:'44px', height:'28px', borderRadius:'6px', objectFit:'cover', flexShrink:0, border:'1px solid #F0F1F3' }}/>
                        ) : (
                          <div style={{ width:'44px', height:'28px', borderRadius:'6px', background:'rgba(27,42,74,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', flexShrink:0 }}>🎥</div>
                        )}
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:'12px', fontWeight:600, color:'#1A1D23', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {vp.video?.title || 'Deleted Video'}
                          </p>
                          <p style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'1px' }}>
                            {new Date(vp.lastPlayed).toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' })}
                          </p>
                        </div>
                        <span style={{ fontSize:'11px', fontWeight:700, color:vp.playCount>=3 ? '#ef4444' : '#1B2A4A', background:vp.playCount>=3 ? 'rgba(239,68,68,0.08)' : 'rgba(27,42,74,0.06)', padding:'2px 8px', borderRadius:'6px', flexShrink:0 }}>
                          {vp.playCount}/3
                        </span>
                      </div>
                    )) : (
                      <div style={{ padding:'14px', textAlign:'center' }}>
                        <p style={{ color:'#9CA3AF', fontSize:'12px' }}>No videos played yet</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign:'center', padding:'40px 0' }}>
                  <p style={{ color:'#9CA3AF', fontSize:'13px' }}>Failed to load details</p>
                </div>
              )}
            </div>

            <div className="usr-drawer-ft">
              <button onClick={e => handleAction(selectedUser._id, 'reset-device', e)}
                disabled={actionLoading===`${selectedUser._id}-reset-device`}
                className="adm-btn-secondary" style={{ fontSize:'12px', display:'flex', alignItems:'center', gap:'5px' }}>
                {actionLoading===`${selectedUser._id}-reset-device` ? (
                  <svg style={{ width:'12px',height:'12px',animation:'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : '📱'} Reset Device
              </button>

              {selectedUser.isActive ? (
                <button onClick={e => handleAction(selectedUser._id, 'block', e)}
                  disabled={actionLoading===`${selectedUser._id}-block`}
                  style={{ padding:'9px 14px', borderRadius:'11px', border:'1.5px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.06)', color:'#dc2626', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:'5px' }}>
                  {actionLoading===`${selectedUser._id}-block` ? (
                    <svg style={{ width:'12px',height:'12px',animation:'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : '🚫'} Block
                </button>
              ) : (
                <button onClick={e => handleAction(selectedUser._id, 'unblock', e)}
                  disabled={actionLoading===`${selectedUser._id}-unblock`}
                  style={{ padding:'9px 14px', borderRadius:'11px', border:'1.5px solid rgba(22,163,74,0.3)', background:'rgba(22,163,74,0.06)', color:'#16a34a', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:'5px' }}>
                  {actionLoading===`${selectedUser._id}-unblock` ? (
                    <svg style={{ width:'12px',height:'12px',animation:'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : '✓'} Unblock
                </button>
              )}

              <button onClick={closeDetail} className="adm-btn-secondary" style={{ marginLeft:'auto', fontSize:'12px' }}>Close</button>
            </div>
          </aside>
        </>
      )}

      <div className="usr-page">

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:isMobile ? '20px' : 'clamp(20px,3vw,26px)', color:'#1A1D23', marginBottom:'4px' }}>Users</h1>
            <p style={{ color:'#6B7280', fontSize:'13px' }}>Manage registered users and subscriptions</p>
          </div>
          <button onClick={() => fetchUsers(pagination.page)} disabled={loading}
            className="adm-btn-secondary" style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ display:'inline-block', animation:loading ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
            {!isMobile && 'Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:statCols, gap:isMobile ? '10px' : '12px' }}>
          {STATS_ROW.map(s => (
            <div key={s.label} className="usr-stat-card">
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:s.accent, borderRadius:'16px 16px 0 0', opacity:0, transition:'opacity .25s' }}
                ref={el => {
                  if (!el) return
                  const card = el.closest('.usr-stat-card')
                  if (!card) return
                  card.addEventListener('mouseenter', () => el.style.opacity='1')
                  card.addEventListener('mouseleave', () => el.style.opacity='0')
                }}/>
              <div style={{ fontFamily:'Playfair Display,serif', fontWeight:800, fontSize:isMobile ? 'clamp(20px,5vw,26px)' : 'clamp(22px,3vw,28px)', color:s.accent, lineHeight:1, marginBottom:'4px' }}>
                {loading ? <div className="usr-skel" style={{ width:'36px', height:'24px' }}/> : s.value}
              </div>
              <div style={{ color:'#6B7280', fontSize:isMobile ? '11px' : '12px', fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div style={{ display:'flex', flexDirection:isMobile ? 'column' : 'row', gap:'10px', alignItems:isMobile ? 'stretch' : 'center' }}>
          <div style={{ position:'relative', flex:1 }}>
            <svg style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', width:'15px', height:'15px', color:'#9CA3AF', pointerEvents:'none' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" placeholder="Search by name, email or mobile…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="adm-input" style={{ paddingLeft:'36px' }}/>
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#9CA3AF', cursor:'pointer', fontSize:'14px' }}>✕</button>
            )}
          </div>
          <div className="usr-filter-track">
            <div className="usr-filter-inner">
              {FILTER_TABS.map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`usr-flt-btn ${filter===f.id ? 'active' : 'inactive'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!isMobile && (
          <p style={{ fontSize:'12px', color:'#9CA3AF', marginTop:'-6px' }}>
            💡 Click any row to view full user details
          </p>
        )}

        {/* Table / Cards */}
        {loading ? (
          <div className="adm-spinner">
            <svg style={{ width:'28px',height:'28px',animation:'spin 1s linear infinite',color:'#E8A838',marginBottom:'10px' }}
              fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p style={{ color:'#9CA3AF', fontSize:'13px' }}>Loading users…</p>
          </div>
        ) : isMobile ? (
          /* Mobile card list */
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 20px', borderRadius:'14px', background:'#FFFFFF', border:'1.5px solid #F0F1F3' }}>
                <div style={{ fontSize:'44px', marginBottom:'10px' }}>👥</div>
                <p style={{ color:'#9CA3AF', fontSize:'14px', fontWeight:500 }}>No users found</p>
              </div>
            ) : filtered.map(user => (
              <div key={user._id} className={`usr-mob-card ${selectedUser?._id===user._id ? 'selected' : ''}`}
                onClick={() => openDetail(user)}>
                <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                  <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'linear-gradient(135deg,#1B2A4A,#243656)', display:'flex', alignItems:'center', justifyContent:'center', color:'#E8A838', fontWeight:700, fontSize:'14px', flexShrink:0 }}>
                    {user.fullName?.charAt(0) || '?'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:600, fontSize:'13px', color:user.isActive ? '#1A1D23' : '#9CA3AF', textDecoration:user.isActive ? 'none' : 'line-through', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {user.fullName}
                    </p>
                    <p style={{ color:'#9CA3AF', fontSize:'11px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</p>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'4px', alignItems:'flex-end', flexShrink:0 }}>
                    {user.subscription?.status==='active'
                      ? <span className="adm-badge adm-badge-yellow" style={{ fontSize:'10px' }}>⭐ Premium</span>
                      : <span className="adm-badge adm-badge-gray" style={{ fontSize:'10px' }}>Free</span>}
                    {!user.isActive && <span className="adm-badge adm-badge-red" style={{ fontSize:'10px' }}>Blocked</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:'6px', marginTop:'10px' }} onClick={e => e.stopPropagation()}>
                  <button onClick={e => handleAction(user._id, 'reset-device', e)}
                    disabled={actionLoading===`${user._id}-reset-device`}
                    className="usr-act-btn reset" style={{ flex:1, textAlign:'center', padding:'7px', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'8px', color:'#6B7280' }}>
                    📱 Reset
                  </button>
                  <button onClick={e => handleAction(user._id, user.isActive ? 'block' : 'unblock', e)}
                    disabled={actionLoading===`${user._id}-block` || actionLoading===`${user._id}-unblock`}
                    className={`usr-act-btn ${user.isActive ? 'block' : 'unblock'}`}
                    style={{ flex:1, textAlign:'center', padding:'7px', background:user.isActive ? 'rgba(239,68,68,0.07)' : 'rgba(22,163,74,0.07)', border:`1px solid ${user.isActive ? 'rgba(239,68,68,0.2)' : 'rgba(22,163,74,0.2)'}`, borderRadius:'8px' }}>
                    {user.isActive ? '🚫 Block' : '✓ Unblock'}
                  </button>
                  <button onClick={() => openDetail(user)}
                    style={{ flex:1, padding:'7px', borderRadius:'8px', background:'rgba(27,42,74,0.06)', border:'1px solid rgba(27,42,74,0.1)', color:'#1B2A4A', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                    👁 Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop/Tablet table */
          <div className="adm-table-wrap">
            <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
              <table className="adm-table" style={{ minWidth:isTablet ? '580px' : '700px' }}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact</th>
                    {!isTablet && <th style={{ textAlign:'center' }}>Verified</th>}
                    <th>Subscription</th>
                    {!isTablet && <th>Joined</th>}
                    <th style={{ textAlign:'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(user => (
                    <tr key={user._id} className={`usr-row ${selectedUser?._id===user._id ? 'selected' : ''}`}
                      onClick={() => openDetail(user)}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'linear-gradient(135deg,#1B2A4A,#243656)', display:'flex', alignItems:'center', justifyContent:'center', color:'#E8A838', fontWeight:700, fontSize:'13px', flexShrink:0 }}>
                            {user.fullName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p style={{ fontWeight:600, fontSize:'13px', color:user.isActive ? '#1A1D23' : '#9CA3AF', textDecoration:user.isActive ? 'none' : 'line-through' }}>
                              {user.fullName}
                            </p>
                            {!user.isActive && <span className="adm-badge adm-badge-red" style={{ marginTop:'2px', display:'inline-block' }}>Blocked</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <p style={{ color:'#1A1D23', fontSize:'12px', fontWeight:500 }}>{user.email}</p>
                        {!isTablet && <p style={{ color:'#9CA3AF', fontSize:'12px', marginTop:'2px' }}>{user.mobile}</p>}
                      </td>
                      {!isTablet && (
                        <td style={{ textAlign:'center' }}>
                          <div style={{ display:'flex', justifyContent:'center', gap:'6px' }}>
                            <span style={{ fontSize:'11px', fontWeight:700, color:user.isEmailVerified ? '#16a34a' : '#dc2626', background:user.isEmailVerified ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', padding:'2px 7px', borderRadius:'6px' }}>
                              {user.isEmailVerified ? '✉✓' : '✉✗'}
                            </span>
                            <span style={{ fontSize:'11px', fontWeight:700, color:user.isMobileVerified ? '#16a34a' : '#dc2626', background:user.isMobileVerified ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', padding:'2px 7px', borderRadius:'6px' }}>
                              {user.isMobileVerified ? '📱✓' : '📱✗'}
                            </span>
                          </div>
                        </td>
                      )}
                      <td>
                        {user.subscription?.status==='active' ? (
                          <div>
                            <span className="adm-badge adm-badge-yellow">⭐ Premium</span>
                            {!isTablet && <p style={{ color:'#9CA3AF', fontSize:'11px', marginTop:'3px' }}>
                              Until {new Date(user.subscription.endDate).toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' })}
                            </p>}
                          </div>
                        ) : (
                          <span className="adm-badge adm-badge-gray">Free</span>
                        )}
                      </td>
                      {!isTablet && (
                        <td style={{ color:'#6B7280', fontSize:'12px' }}>
                          {new Date(user.createdAt).toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' })}
                        </td>
                      )}
                      <td style={{ textAlign:'right' }}>
                        <div style={{ display:'flex', justifyContent:'flex-end', gap:'4px' }} onClick={e => e.stopPropagation()}>
                          <button onClick={e => handleAction(user._id, 'reset-device', e)}
                            disabled={actionLoading===`${user._id}-reset-device`}
                            className="usr-act-btn reset" title="Reset Device">
                            {actionLoading===`${user._id}-reset-device` ? '…' : '📱'}
                          </button>
                          <button onClick={e => handleAction(user._id, user.isActive ? 'block' : 'unblock', e)}
                            disabled={actionLoading===`${user._id}-block` || actionLoading===`${user._id}-unblock`}
                            className={`usr-act-btn ${user.isActive ? 'block' : 'unblock'}`}>
                            {actionLoading===`${user._id}-block` || actionLoading===`${user._id}-unblock`
                              ? '…' : user.isActive ? 'Block' : 'Unblock'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length===0 && (
                    <tr><td colSpan={isTablet ? 4 : 6}>
                      <div className="adm-empty">
                        <div style={{ fontSize:'44px', marginBottom:'12px' }}>👥</div>
                        <p style={{ color:'#9CA3AF', fontSize:'14px', fontWeight:500 }}>No users found.</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
            <p style={{ color:'#9CA3AF', fontSize:'12px' }}>
              {((pagination.page-1)*pagination.limit)+1}–{Math.min(pagination.page*pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
              <button onClick={() => fetchUsers(pagination.page-1)} disabled={pagination.page<=1 || loading} className="usr-pg-nav">← Prev</button>
              {Array.from({ length:Math.min(pagination.pages, isMobile ? 3 : 5) }, (_,i) => i+1).map(pg => (
                <button key={pg} onClick={() => fetchUsers(pg)} disabled={loading}
                  className={`usr-pg-btn ${pagination.page===pg ? 'active' : 'inactive'}`}>{pg}</button>
              ))}
              <button onClick={() => fetchUsers(pagination.page+1)} disabled={pagination.page>=pagination.pages || loading} className="usr-pg-nav">Next →</button>
            </div>
          </div>
        )}

      </div>
    </>
  )
}