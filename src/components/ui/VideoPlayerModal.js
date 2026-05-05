// src/components/ui/VideoPlayerModal.js
'use client'
import { useEffect, useRef, useState } from 'react'

const tk = {
  navy: '#1B2A4A', navyLight: '#243656',
  gold: '#E8A838', goldDark: '#D4922A',
  teal: '#2A9D8F',
}

function FloatingWatermark({ text }) {
  const [pos, setPos] = useState({ x: 15, y: 20 })
  useEffect(() => {
    const positions = [
      { x:15, y:20 },{ x:55, y:65 },{ x:70, y:15 },
      { x:20, y:70 },{ x:40, y:40 },{ x:75, y:55 },
    ]
    let idx = 0
    const timer = setInterval(() => {
      idx = (idx + 1) % positions.length
      setPos(positions[idx])
    }, 8000)
    return () => clearInterval(timer)
  }, [])
  if (!text) return null
  return (
    <div style={{
      position:'absolute', left:`${pos.x}%`, top:`${pos.y}%`,
      transform:'translate(-50%,-50%)',
      transition:'left 2s ease, top 2s ease',
      color:'rgba(255,255,255,0.1)', fontSize:'clamp(9px,1.4vw,12px)',
      fontWeight:700, letterSpacing:'0.5px',
      pointerEvents:'none', userSelect:'none',
      zIndex:5, whiteSpace:'nowrap',
    }}>🔒 {text}</div>
  )
}

function CaptureWarning({ onDismiss }) {
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:200,
      background:'rgba(0,0,0,0.95)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      gap:'14px', padding:'24px',
    }}>
      <div style={{
        width:'68px', height:'68px', borderRadius:'50%',
        background:'rgba(239,68,68,0.15)',
        border:'2px solid rgba(239,68,68,0.4)',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:'30px',
      }}>🔒</div>
      <p style={{ color:'#fff', fontSize:'clamp(14px,2.5vw,17px)', fontWeight:700, textAlign:'center', lineHeight:1.4 }}>
        Recording &amp; Screenshots Not Permitted
      </p>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'clamp(11px,1.8vw,13px)', textAlign:'center', maxWidth:'300px', lineHeight:1.6 }}>
        Playback paused to protect this content. Activity has been logged.
      </p>
      <button onClick={onDismiss} style={{
        padding:'10px 28px', borderRadius:'10px',
        background:tk.gold, color:tk.navy,
        fontWeight:700, fontSize:'13px',
        border:'none', cursor:'pointer',
      }}>Resume Playback</button>
    </div>
  )
}

export default function VideoPlayerModal({ video, onClose, onPlayLimitExceeded, watermarkText }) {
  const videoRef         = useRef(null)
  const containerRef     = useRef(null)
  const controlsTimerRef = useRef(null)
  const captureTimerRef  = useRef(null)

  const [playing,       setPlaying]       = useState(false)
  const [muted,         setMuted]         = useState(false)
  const [volume,        setVolume]        = useState(1)
  const [currentTime,   setCurrent]       = useState(0)
  const [duration,      setDuration]      = useState(0)
  const [buffered,      setBuffered]      = useState(0)
  const [isFullscreen,  setIsFullscreen]  = useState(false)
  const [showControls,  setShowControls]  = useState(true)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [playbackRate,  setPlaybackRate]  = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [captureWarning,setCaptureWarning]= useState(false)
  const [isMobile,      setIsMobile]      = useState(false)

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 640) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function pauseVideo() {
    const v = videoRef.current
    if (v && !v.paused) v.pause()
  }

  function triggerCaptureWarning() {
    pauseVideo(); setCaptureWarning(true)
    clearTimeout(captureTimerRef.current)
    captureTimerRef.current = setTimeout(() => setCaptureWarning(false), 6000)
  }
  function dismissWarning() {
    setCaptureWarning(false); clearTimeout(captureTimerRef.current)
  }

  /* Protection layers */
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'PrintScreen' || e.keyCode === 44) { e.preventDefault(); triggerCaptureWarning(); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); return }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') { e.preventDefault(); triggerCaptureWarning() }
    }
    function onKeyUp(e) {
      if (e.key === 'PrintScreen' || e.keyCode === 44) { e.preventDefault(); triggerCaptureWarning() }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [])

  useEffect(() => {
    function onVisibility() { if (document.visibilityState === 'hidden') pauseVideo() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    function onBlur() { pauseVideo() }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [])

  useEffect(() => {
    if (!navigator.mediaDevices?.getDisplayMedia) return
    const original = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices)
    navigator.mediaDevices.getDisplayMedia = async (...args) => { triggerCaptureWarning(); return original(...args) }
    return () => { navigator.mediaDevices.getDisplayMedia = original }
  }, [])

  useEffect(() => {
    const v = videoRef.current; if (!v) return
    function onEnterPip() {
      if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {})
      triggerCaptureWarning()
    }
    v.addEventListener('enterpictureinpicture', onEnterPip)
    return () => v.removeEventListener('enterpictureinpicture', onEnterPip)
  }, [])

  /* Keyboard shortcuts */
  useEffect(() => {
    function onKey(e) {
      if (!video || captureWarning) return
      switch (e.key) {
        case 'Escape': if (isFullscreen) exitFullscreen(); else onClose(); break
        case ' ': case 'k': e.preventDefault(); togglePlay(); break
        case 'f': e.preventDefault(); toggleFullscreen(); break
        case 'm': e.preventDefault(); toggleMute(); break
        case 'ArrowRight': e.preventDefault(); seek(10); break
        case 'ArrowLeft':  e.preventDefault(); seek(-10); break
        case 'ArrowUp':    e.preventDefault(); changeVolume(0.1); break
        case 'ArrowDown':  e.preventDefault(); changeVolume(-0.1); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [video, isFullscreen, playing, captureWarning])

  useEffect(() => {
    function onFsChange() { setIsFullscreen(!!document.fullscreenElement) }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange)
    }
  }, [])

  function resetControlsTimer() {
    setShowControls(true); clearTimeout(controlsTimerRef.current)
    if (playing) controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000)
  }
  useEffect(() => {
    if (playing) { controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000) }
    else { setShowControls(true); clearTimeout(controlsTimerRef.current) }
    return () => clearTimeout(controlsTimerRef.current)
  }, [playing])

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])
  useEffect(() => {
    const v = videoRef.current; if (!v || !video?.videoUrl) return
    setLoading(true); setError(null); setCaptureWarning(false); v.load()
  }, [video?.videoUrl])
  useEffect(() => () => { clearTimeout(captureTimerRef.current); clearTimeout(controlsTimerRef.current) }, [])

  function togglePlay() {
    const v = videoRef.current; if (!v) return
    if (v.paused) v.play().catch(() => {}); else v.pause()
  }
  function toggleMute() {
    const v = videoRef.current; if (!v) return
    v.muted = !v.muted; setMuted(v.muted)
  }
  function changeVolume(delta) {
    const v = videoRef.current; if (!v) return
    const nv = Math.min(1, Math.max(0, v.volume + delta))
    v.volume = nv; setVolume(nv)
    if (nv > 0) { v.muted = false; setMuted(false) }
  }
  function seek(delta) {
    const v = videoRef.current; if (!v) return
    v.currentTime = Math.min(v.duration || 0, Math.max(0, v.currentTime + delta))
  }
  function toggleFullscreen() {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.()
    else exitFullscreen()
  }
  function exitFullscreen() { if (document.fullscreenElement) document.exitFullscreen?.() }
  function setSpeed(rate) {
    const v = videoRef.current; if (v) v.playbackRate = rate
    setPlaybackRate(rate); setShowSpeedMenu(false)
  }
  function fmtTime(s) {
    if (!s || isNaN(s)) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    return `${m}:${String(sec).padStart(2,'0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  if (!video) return null

  return (
    <>
      <style>{`
        @keyframes modalIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes spin     { to{transform:rotate(360deg)} }

        .vpm-protected {
          -webkit-user-select:none; -moz-user-select:none;
          user-select:none; -webkit-touch-callout:none;
          -webkit-tap-highlight-color:transparent;
        }
        .vpm-overlay {
          position:fixed; inset:0; z-index:9999;
          background:rgba(0,0,0,0.90);
          display:flex; align-items:center; justify-content:center;
          padding:12px;
          backdrop-filter:blur(14px);
          -webkit-backdrop-filter:blur(14px);
        }
        .vpm-container {
          position:relative; width:100%; max-width:1060px;
          background:#000; border-radius:16px; overflow:hidden;
          box-shadow:0 32px 80px rgba(0,0,0,0.65);
          animation:modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .vpm-container:fullscreen,
        .vpm-container:-webkit-full-screen {
          border-radius:0; max-width:100%; max-height:100%;
        }
        .vpm-video-wrap {
          position:relative; width:100%;
          aspect-ratio:16/9; background:#000; overflow:hidden;
        }
        .vpm-video {
          position:absolute; inset:0;
          width:100%; height:100%;
          object-fit:contain; display:block; cursor:pointer;
        }
        .vpm-shield {
          position:absolute; inset:0; z-index:6;
          pointer-events:auto; background:transparent;
        }
        .vpm-controls {
          position:absolute; bottom:0; left:0; right:0;
          background:linear-gradient(transparent,rgba(0,0,0,0.82) 40%);
          padding:36px 12px 12px;
          transition:opacity 0.3s ease; z-index:10;
        }
        .vpm-progress-wrap {
          position:relative; height:20px;
          display:flex; align-items:center;
          cursor:pointer; margin-bottom:8px;
          touch-action:none;
        }
        .vpm-progress-bg {
          position:absolute; height:4px; width:100%;
          background:rgba(255,255,255,0.18);
          border-radius:99px; transition:height 0.2s ease;
        }
        .vpm-progress-wrap:hover .vpm-progress-bg { height:6px; }
        .vpm-progress-buf {
          position:absolute; height:100%;
          border-radius:99px;
          background:rgba(255,255,255,0.22);
          transition:width 0.3s ease;
        }
        .vpm-progress-fill {
          position:absolute; height:100%;
          border-radius:99px;
          background:linear-gradient(90deg,${tk.gold},${tk.goldDark});
          transition:width 0.1s linear;
          box-shadow:0 0 6px rgba(232,168,56,0.55);
        }
        .vpm-progress-thumb {
          position:absolute; width:13px; height:13px;
          background:${tk.gold}; border-radius:50%;
          transform:translateX(-50%) scale(0);
          transition:transform 0.2s ease;
          box-shadow:0 2px 8px rgba(0,0,0,0.5);
          pointer-events:none; z-index:2;
        }
        .vpm-progress-wrap:hover .vpm-progress-thumb { transform:translateX(-50%) scale(1); }

        .vpm-btn {
          all:unset; cursor:pointer; color:#fff;
          width:34px; height:34px; border-radius:7px;
          display:flex; align-items:center; justify-content:center;
          font-size:15px; transition:all 0.18s ease;
          flex-shrink:0; touch-action:manipulation;
        }
        .vpm-btn:hover  { background:rgba(255,255,255,0.14); transform:scale(1.08); }
        .vpm-btn:active { transform:scale(0.94); }

        .vpm-vol-slider {
          -webkit-appearance:none; appearance:none;
          height:3px; border-radius:99px;
          outline:none; cursor:pointer; width:66px;
          background:linear-gradient(
            to right, ${tk.gold} 0%, ${tk.gold} var(--vol,100%),
            rgba(255,255,255,0.28) var(--vol,100%), rgba(255,255,255,0.28) 100%
          );
          touch-action:none;
        }
        .vpm-vol-slider::-webkit-slider-thumb {
          -webkit-appearance:none; width:11px; height:11px;
          border-radius:50%; background:#fff;
          cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,0.4);
        }
        .vpm-time {
          font-size:11px; color:rgba(255,255,255,0.82);
          white-space:nowrap; font-variant-numeric:tabular-nums;
        }
        .vpm-title-bar {
          position:absolute; top:0; left:0; right:0;
          padding:12px; display:flex; align-items:center;
          justify-content:space-between; gap:10px;
          background:linear-gradient(rgba(0,0,0,0.68),transparent);
          transition:opacity 0.3s ease; z-index:10;
        }
        .vpm-title-text {
          font-size:13px; font-weight:600; color:#fff;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
          text-shadow:0 1px 4px rgba(0,0,0,0.5);
        }
        .vpm-close-btn {
          all:unset; cursor:pointer;
          width:34px; height:34px; border-radius:50%;
          background:rgba(0,0,0,0.45); color:#fff;
          display:flex; align-items:center; justify-content:center;
          font-size:20px; font-weight:300;
          border:1px solid rgba(255,255,255,0.14);
          transition:all 0.2s ease; flex-shrink:0;
          backdrop-filter:blur(6px); touch-action:manipulation;
        }
        .vpm-close-btn:hover { background:rgba(239,68,68,0.65); transform:scale(1.08); }

        .vpm-speed-menu {
          position:absolute; bottom:100%; right:0; margin-bottom:8px;
          background:rgba(18,18,18,0.96);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:10px; overflow:hidden; min-width:78px;
          backdrop-filter:blur(12px); z-index:20;
        }
        .vpm-speed-item {
          padding:8px 14px; font-size:12px; color:#fff;
          cursor:pointer; transition:background 0.15s;
          text-align:center; font-weight:500;
        }
        .vpm-speed-item:hover  { background:rgba(255,255,255,0.1); }
        .vpm-speed-item.active { color:${tk.gold}; font-weight:700; }

        .vpm-badge {
          padding:3px 9px; border-radius:999px;
          font-size:10px; font-weight:700; white-space:nowrap;
        }
        .vpm-loader {
          position:absolute; inset:0;
          display:flex; align-items:center; justify-content:center;
          background:rgba(0,0,0,0.45); pointer-events:none; z-index:15;
        }
        .vpm-spinner {
          width:42px; height:42px; border-radius:50%;
          border:3px solid rgba(255,255,255,0.12);
          border-top-color:${tk.gold};
          animation:spin 0.9s linear infinite;
        }
        .vpm-center-play {
          position:absolute; inset:0; pointer-events:none;
          display:flex; align-items:center; justify-content:center; z-index:8;
        }
        .vpm-big-play {
          width:66px; height:66px; border-radius:50%;
          background:rgba(0,0,0,0.52);
          border:2px solid rgba(255,255,255,0.28);
          display:flex; align-items:center; justify-content:center;
          font-size:26px; backdrop-filter:blur(8px);
          transition:all 0.2s ease;
          pointer-events:auto; cursor:pointer; touch-action:manipulation;
        }
        .vpm-big-play:hover {
          background:rgba(232,168,56,0.28);
          border-color:${tk.gold}; transform:scale(1.08);
        }

        /* ── Security bar ── */
        .vpm-security-bar {
          display:flex; align-items:center; justify-content:center;
          gap:6px; padding:5px 14px;
          background:rgba(239,68,68,0.07);
          border-top:1px solid rgba(239,68,68,0.14);
          font-size:10px; font-weight:600;
          color:rgba(255,110,110,0.75);
          user-select:none; pointer-events:none;
          letter-spacing:0.3px;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .vpm-overlay   { padding: 8px; }
          .vpm-vol-slider { width: 50px; }
          .vpm-btn        { width: 30px; height: 30px; font-size: 13px; }
        }
        @media (max-width: 640px) {
          .vpm-overlay    { padding: 0; }
          .vpm-container  { border-radius: 0; }
          .vpm-vol-slider { display: none; }
          .vpm-time       { font-size: 10px; }
          .vpm-btn        { width: 28px; height: 28px; font-size: 12px; }
          .vpm-title-text { font-size: 11px; }
          .vpm-controls   { padding: 28px 8px 10px; }
          .vpm-big-play   { width: 54px; height: 54px; font-size: 20px; }
          .vpm-badge      { display: none; }
        }
        @media (max-height:500px) and (orientation:landscape) {
          .vpm-overlay   { padding: 0; align-items: stretch; }
          .vpm-container { border-radius: 0; height: 100dvh; }
          .vpm-video-wrap{ aspect-ratio: unset; height: 100dvh; }
        }
      `}</style>

      <div
        className="vpm-overlay vpm-protected"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        onContextMenu={e => e.preventDefault()}
      >
        <div
          ref={containerRef}
          className="vpm-container vpm-protected"
          onMouseMove={resetControlsTimer}
          onTouchStart={resetControlsTimer}
          onContextMenu={e => e.preventDefault()}
        >
          <div className="vpm-video-wrap">

            {/* Video */}
            <video
              ref={videoRef}
              className="vpm-video"
              src={video.videoUrl}
              playsInline controls={false}
              onContextMenu={e => e.preventDefault()}
              onPlay={()    => setPlaying(true)}
              onPause={()   => setPlaying(false)}
              onLoadedMetadata={e => { setDuration(e.target.duration); setLoading(false) }}
              onCanPlay={() => { setLoading(false); videoRef.current?.play().catch(() => {}) }}
              onTimeUpdate={e => {
                setCurrent(e.target.currentTime)
                const b = e.target.buffered
                if (b.length > 0 && e.target.duration > 0)
                  setBuffered((b.end(b.length - 1) / e.target.duration) * 100)
              }}
              onWaiting={()  => setLoading(true)}
              onPlaying={()  => setLoading(false)}
              onError={()    => { setError('Failed to load video.'); setLoading(false) }}
              onVolumeChange={e => { setVolume(e.target.volume); setMuted(e.target.muted) }}
            />

            {/* Shield */}
            <div
              className="vpm-shield"
              onContextMenu={e => e.preventDefault()}
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
            />

            <FloatingWatermark text={watermarkText || video.watermark || null}/>

            {/* Loading */}
            {loading && !error && (
              <div className="vpm-loader"><div className="vpm-spinner"/></div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                position:'absolute', inset:0, zIndex:20,
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                background:'rgba(0,0,0,0.82)', gap:'12px',
              }}>
                <span style={{ fontSize:'38px' }}>⚠️</span>
                <p style={{ color:'#fff', fontSize:'14px', fontWeight:600 }}>{error}</p>
                <button
                  onClick={() => { setError(null); setLoading(true); videoRef.current?.load() }}
                  style={{
                    padding:'10px 22px', borderRadius:'10px',
                    background:tk.gold, color:tk.navy,
                    fontWeight:700, border:'none', cursor:'pointer', fontSize:'13px',
                  }}
                >Retry</button>
              </div>
            )}

            {/* Big play */}
            {!playing && !loading && !error && !captureWarning && (
              <div className="vpm-center-play">
                <div className="vpm-big-play" onClick={togglePlay}>▶</div>
              </div>
            )}

            {/* Capture warning */}
            {captureWarning && <CaptureWarning onDismiss={dismissWarning}/>}

            {/* Title bar */}
            <div className="vpm-title-bar" style={{ opacity: showControls ? 1 : 0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:0 }}>
                {video.thumbnail && !isMobile && (
                  <img src={video.thumbnail} alt="" style={{
                    width:'34px', height:'20px', borderRadius:'4px',
                    objectFit:'cover', flexShrink:0,
                    border:'1px solid rgba(255,255,255,0.14)',
                  }}/>
                )}
                <span className="vpm-title-text">{video.title}</span>
                <span className="vpm-badge" style={{
                  background: video.type === 'premium' ? 'rgba(232,168,56,0.22)' : 'rgba(42,157,143,0.22)',
                  color: video.type === 'premium' ? tk.gold : '#5DE8D8',
                  border:`1px solid ${video.type === 'premium' ? 'rgba(232,168,56,0.38)' : 'rgba(42,157,143,0.38)'}`,
                  flexShrink:0,
                }}>
                  {video.type === 'premium' ? '⭐ Premium' : '🎬 Free'}
                </span>
              </div>
              <button className="vpm-close-btn" onClick={onClose} title="Close (Esc)">×</button>
            </div>

            {/* Controls */}
            <div className="vpm-controls" style={{ opacity: showControls ? 1 : 0 }}>

              {/* Progress */}
              <div
                className="vpm-progress-wrap"
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const pct  = (e.clientX - rect.left) / rect.width
                  if (videoRef.current && duration)
                    videoRef.current.currentTime = pct * duration
                }}
                onTouchStart={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const pct  = (e.touches[0].clientX - rect.left) / rect.width
                  if (videoRef.current && duration)
                    videoRef.current.currentTime = pct * duration
                }}
              >
                <div className="vpm-progress-bg">
                  <div className="vpm-progress-buf" style={{ width:`${buffered}%` }}/>
                  <div className="vpm-progress-fill" style={{ width:`${progress}%` }}/>
                </div>
                <div className="vpm-progress-thumb" style={{ left:`${progress}%` }}/>
              </div>

              {/* Controls row */}
              <div style={{ display:'flex', alignItems:'center', gap:'2px' }}>

                <button className="vpm-btn" onClick={togglePlay} title={playing ? 'Pause' : 'Play'}>
                  {playing ? '⏸' : '▶'}
                </button>
                <button className="vpm-btn" onClick={() => seek(-10)} title="Back 10s" style={{ fontSize:'11px' }}>↩10</button>
                <button className="vpm-btn" onClick={() => seek(10)}  title="Fwd 10s"  style={{ fontSize:'11px' }}>10↪</button>

                <button className="vpm-btn" onClick={toggleMute} title="Mute">
                  {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                </button>
                <input
                  type="range" className="vpm-vol-slider"
                  min={0} max={1} step={0.05}
                  value={muted ? 0 : volume}
                  style={{ '--vol':`${(muted ? 0 : volume) * 100}%` }}
                  onChange={e => {
                    const v = parseFloat(e.target.value)
                    if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0 }
                    setVolume(v); setMuted(v === 0)
                  }}
                />

                <span className="vpm-time" style={{ marginLeft:'4px' }}>
                  {fmtTime(currentTime)} / {fmtTime(duration)}
                </span>

                <div style={{ flex:1 }}/>

                {/* Speed */}
                <div style={{ position:'relative' }}>
                  <button
                    className="vpm-btn"
                    onClick={() => setShowSpeedMenu(s => !s)}
                    style={{ fontSize:'10px', fontWeight:700, width:'auto', padding:'0 6px' }}
                  >{playbackRate}×</button>
                  {showSpeedMenu && (
                    <div className="vpm-speed-menu">
                      {[0.5,0.75,1,1.25,1.5,1.75,2].map(r => (
                        <div
                          key={r}
                          className={`vpm-speed-item ${playbackRate === r ? 'active' : ''}`}
                          onClick={() => setSpeed(r)}
                        >{r}×</div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="vpm-btn" onClick={toggleFullscreen} title="Fullscreen">
                  <span style={{ fontSize:'11px' }}>{isFullscreen ? '⤢' : '⤡'}</span>
                </button>
              </div>
            </div>

          </div>{/* end vpm-video-wrap */}

          {/* Security bar */}
          <div className="vpm-security-bar">
            🔒 Recording &amp; screenshots are strictly prohibited 
          </div>

        </div>
      </div>
    </>
  )
}