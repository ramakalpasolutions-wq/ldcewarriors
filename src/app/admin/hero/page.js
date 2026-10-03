// src/app/admin/hero/page.js

'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

import {
  uploadImageToCloudinary,
  uploadVideoToR2Direct,
} from '@/lib/clientUpload'

const tk = {
  navy: '#1B2A4A',
  navyLight: '#243656',
  gold: '#E8A838',
  goldDark: '#D4922A',
  teal: '#2A9D8F',
  bg: '#F5F3EF',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#1A1D23',
  muted: '#6B7280',
  faint: '#9CA3AF',
}

function fmtSize(bytes) {
  if (!bytes) return ''

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const TYPE_CONFIG = {
  image: {
    icon: '🖼️',
    label: 'Image',
    badge: {
      bg: '#EFF6FF',
      color: '#3B82F6',
    },
    accept: 'image/*',
    maxMB: 10,
    hint: 'JPG, PNG, WEBP — Max 10MB',
  },

  video: {
    icon: '🎬',
    label: 'Video',
    badge: {
      bg: '#F5F3FF',
      color: '#8B5CF6',
    },
    accept: 'video/*',
    maxMB: 500,
    hint: 'MP4, MOV, WEBM — Max 500MB',
  },

  article: {
    icon: '📰',
    label: 'Article',
    badge: {
      bg: '#ECFDF5',
      color: '#10B981',
    },
    accept: 'image/*',
    maxMB: 10,
    hint: 'JPG, PNG, WEBP — Max 10MB',
  },
}

function UploadProgress({
  progress,
  isVideo,
  editing,
}) {
  const stages = isVideo
    ? [
        'Preparing…',
        'Uploading…',
        'Processing…',
        editing ? 'Updated!' : 'Done!',
      ]
    : [
        'Preparing…',
        'Uploading…',
        editing ? 'Updated!' : 'Done!',
      ]

  const stageIdx =
    progress < 20
      ? 0
      : progress < 85
        ? 1
        : progress < 95
          ? 2
          : 3

  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: '14px',
        background:
          'linear-gradient(135deg,rgba(27,42,74,0.03),rgba(232,168,56,0.04))',
        border:
          '1.5px solid rgba(232,168,56,0.2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: tk.text,
          }}
        >
          {isVideo ? '☁️' : '🖼️'}{' '}
          {
            stages[
              Math.min(
                stageIdx,
                stages.length - 1
              )
            ]
          }
        </span>

        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: tk.gold,
          }}
        >
          {progress}%
        </span>
      </div>

      <div
        style={{
          height: '7px',
          borderRadius: '999px',
          background:
            'rgba(27,42,74,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: '999px',
            width: `${progress}%`,
            background: `linear-gradient(
              90deg,
              ${tk.navy},
              ${tk.gold}
            )`,
            transition: 'width 0.5s ease',
            boxShadow:
              '0 0 10px rgba(232,168,56,0.4)',
          }}
        />
      </div>

      {isVideo && progress < 90 && (
        <p
          style={{
            fontSize: '11px',
            color: tk.faint,
            marginTop: '8px',
            textAlign: 'center',
          }}
        >
          Uploading directly to cloud —
          please wait…
        </p>
      )}
    </div>
  )
}

export default function AdminHeroPage() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] =
    useState(true)

  const [showForm, setShowForm] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [deleting, setDeleting] =
    useState(null)

  // EDIT STATE
  const [editingId, setEditingId] =
    useState(null)

  const [progress, setProgress] =
    useState(0)

  const [isMobile, setIsMobile] =
    useState(false)

  const [isTablet, setIsTablet] =
    useState(false)

  const [form, setForm] = useState({
    type: 'image',
    title: '',
    order: 0,

    // New selected file
    media: null,
    mediaPreview: '',

    // Existing media while editing
    existingMediaUrl: '',
    existingMediaPublicId: '',
    existingVideoKey: '',
  })

  /* =========================================
     RESPONSIVE
  ========================================= */

  useEffect(() => {
    function check() {
      setIsMobile(
        window.innerWidth < 640
      )

      setIsTablet(
        window.innerWidth >= 640 &&
          window.innerWidth < 1024
      )
    }

    check()

    window.addEventListener(
      'resize',
      check
    )

    return () =>
      window.removeEventListener(
        'resize',
        check
      )
  }, [])

  /* =========================================
     FETCH SLIDES
  ========================================= */

  const fetchSlides =
    useCallback(async () => {
      setLoading(true)

      try {
        const res = await fetch(
          '/api/admin/hero',
          {
            credentials: 'include',
            cache: 'no-store',
          }
        )

        const data = await res.json()

        if (data.success) {
          setSlides(data.items || [])
        } else {
          toast.error(
            data.error ||
              'Failed to load slides'
          )
        }
      } catch (error) {
        console.error(
          'Fetch hero error:',
          error
        )

        toast.error(
          'Failed to fetch hero slides'
        )
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => {
    fetchSlides()
  }, [fetchSlides])

  /* =========================================
     RESET FORM
  ========================================= */

  function resetForm() {
    if (
      form.mediaPreview &&
      form.mediaPreview.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        form.mediaPreview
      )
    }

    setForm({
      type: 'image',
      title: '',
      order: 0,

      media: null,
      mediaPreview: '',

      existingMediaUrl: '',
      existingMediaPublicId: '',
      existingVideoKey: '',
    })

    setEditingId(null)
    setProgress(0)
  }

  /* =========================================
     ADD NEW
  ========================================= */

  function handleAddNew() {
    resetForm()
    setShowForm(true)
  }

  /* =========================================
     EDIT
  ========================================= */

  function handleEdit(slide) {
    if (saving) return

    const id =
      slide._id || slide.id

    setEditingId(id)

    setForm({
      type:
        slide.type || 'image',

      title:
        slide.title || '',

      order:
        Number(slide.order) || 0,

      media: null,
      mediaPreview: '',

      existingMediaUrl:
        slide.mediaUrl || '',

      existingMediaPublicId:
        slide.mediaPublicId || '',

      existingVideoKey:
        slide.videoKey || '',
    })

    setProgress(0)
    setShowForm(true)

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }, 100)
  }

  /* =========================================
     TYPE CHANGE
  ========================================= */

  function handleTypeChange(
    newType
  ) {
    if (saving) return

    // When editing and type changes,
    // existing media should not be reused
    // because image/video storage differs.
    const typeChanged =
      newType !== form.type

    if (
      form.mediaPreview &&
      form.mediaPreview.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        form.mediaPreview
      )
    }

    setForm((f) => ({
      ...f,

      type: newType,

      media: null,
      mediaPreview: '',

      existingMediaUrl:
        typeChanged
          ? ''
          : f.existingMediaUrl,

      existingMediaPublicId:
        typeChanged
          ? ''
          : f.existingMediaPublicId,

      existingVideoKey:
        typeChanged
          ? ''
          : f.existingVideoKey,
    }))
  }

  /* =========================================
     FILE CHANGE
  ========================================= */

  function handleFileChange(e) {
    const file =
      e.target.files?.[0]

    if (!file) return

    const config =
      TYPE_CONFIG[form.type]

    if (
      file.size >
      config.maxMB *
        1024 *
        1024
    ) {
      toast.error(
        `File must be under ${config.maxMB}MB`
      )

      e.target.value = ''
      return
    }

    if (
      form.mediaPreview &&
      form.mediaPreview.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        form.mediaPreview
      )
    }

    const preview =
      file.type.startsWith(
        'image/'
      )
        ? URL.createObjectURL(file)
        : ''

    setForm((prev) => ({
      ...prev,
      media: file,
      mediaPreview: preview,
    }))
  }

  /* =========================================
     REMOVE NEW FILE
  ========================================= */

  function removeSelectedFile() {
    if (
      form.mediaPreview &&
      form.mediaPreview.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        form.mediaPreview
      )
    }

    setForm((f) => ({
      ...f,
      media: null,
      mediaPreview: '',
    }))
  }

  /* =========================================
     SAVE / UPDATE
  ========================================= */

  async function handleSave(e) {
    e.preventDefault()

    if (!form.title.trim()) {
      toast.error(
        'Title is required'
      )
      return
    }

    /*
      ADD:
      media is compulsory.

      EDIT:
      new media is optional as long as
      existing media is available.
    */

    if (
      !editingId &&
      !form.media
    ) {
      toast.error(
        'Media file is required'
      )
      return
    }

    if (
      editingId &&
      !form.media &&
      !form.existingMediaUrl
    ) {
      toast.error(
        'Please select a media file'
      )
      return
    }

    setSaving(true)
    setProgress(5)

    try {
      /*
        Start with old media.

        If admin selects a new file,
        these values are replaced.
      */

      let mediaUrl =
        form.existingMediaUrl ||
        null

      let mediaPublicId =
        form.existingMediaPublicId ||
        null

      let videoKey =
        form.existingVideoKey ||
        null

      /* =====================================
         NEW MEDIA SELECTED
      ===================================== */

      if (form.media) {
        if (
          form.type === 'video'
        ) {
          toast.loading(
            editingId
              ? 'Uploading replacement video…'
              : 'Uploading video to cloud…',
            {
              id: 'hero-upload',
            }
          )

          const result =
            await uploadVideoToR2Direct(
              form.media,
              'hero/videos',
              (percent) => {
                setProgress(
                  Math.round(
                    percent * 0.9
                  )
                )
              }
            )

          mediaUrl =
            result.publicUrl

          videoKey =
            result.key

          mediaPublicId = null

          console.log(
            '✅ Hero video uploaded to R2:',
            videoKey
          )

          setProgress(92)
        } else {
          toast.loading(
            editingId
              ? 'Uploading replacement image…'
              : 'Uploading image…',
            {
              id: 'hero-upload',
            }
          )

          setProgress(20)

          const folder =
            `ldce/hero/${form.type}`

          const result =
            await uploadImageToCloudinary(
              form.media,
              folder
            )

          mediaUrl =
            result.url

          mediaPublicId =
            result.publicId

          videoKey = null

          console.log(
            '✅ Hero image uploaded:',
            mediaPublicId
          )

          setProgress(80)
        }
      }

      /* =====================================
         SAVE METADATA
      ===================================== */

      toast.loading(
        editingId
          ? 'Updating hero slide…'
          : 'Saving hero slide…',
        {
          id: 'hero-upload',
        }
      )

      setProgress(92)

      const payload = {
        type: form.type,

        title:
          form.title.trim(),

        order:
          Number(form.order) || 0,

        mediaUrl,
        mediaPublicId,
        videoKey,
      }

      if (editingId) {
        payload.id =
          editingId
      }

      const res = await fetch(
        '/api/admin/hero',
        {
          method:
            editingId
              ? 'PUT'
              : 'POST',

          credentials:
            'include',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      )

      const data =
        await res.json()

      if (
        !res.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            (
              editingId
                ? 'Failed to update slide'
                : 'Failed to add slide'
            )
        )
      }

      setProgress(100)

      toast.success(
        editingId
          ? '✅ Hero slide updated!'
          : form.type ===
              'video'
            ? '✅ Video uploaded!'
            : '✅ Hero slide added!',
        {
          id: 'hero-upload',
        }
      )

      resetForm()
      setShowForm(false)

      await fetchSlides()
    } catch (error) {
      console.error(
        'Hero save error:',
        error
      )

      toast.error(
        `Save failed: ${error.message}`,
        {
          id: 'hero-upload',
        }
      )
    } finally {
      setTimeout(() => {
        setSaving(false)
        setProgress(0)
      }, 600)
    }
  }

  /* =========================================
     DELETE
  ========================================= */

  async function handleDelete(id) {
    if (
      !confirm(
        'Delete this hero slide? This cannot be undone.'
      )
    ) {
      return
    }

    setDeleting(id)

    try {
      const res =
        await fetch(
          `/api/admin/hero?id=${id}`,
          {
            method: 'DELETE',
            credentials:
              'include',
          }
        )

      const data =
        await res.json()

      if (data.success) {
        setSlides(
          (prev) =>
            prev.filter(
              (slide) =>
                slide._id !== id &&
                slide.id !== id
            )
        )

        if (
          editingId === id
        ) {
          resetForm()
          setShowForm(false)
        }

        toast.success(
          'Slide deleted'
        )
      } else {
        toast.error(
          data.error ||
            'Delete failed'
        )
      }
    } catch (error) {
      console.error(
        'Delete hero error:',
        error
      )

      toast.error(
        'Failed to delete slide'
      )
    } finally {
      setDeleting(null)
    }
  }

  const cfg =
    TYPE_CONFIG[form.type] ||
    TYPE_CONFIG.image

  return (
    <>
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }

          100% {
            background-position: 200% 0;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        .hero-pg {
          display: flex;
          flex-direction: column;
          gap: ${isMobile ? '14px' : '22px'};
          animation: fadeInUp .4s ease both;
        }

        .hero-type-btn {
          padding: ${
            isMobile
              ? '10px 6px'
              : '14px 10px'
          };

          border-radius: 12px;
          border: 2px solid ${tk.border};
          background: #FAFAFA;
          cursor: pointer;
          text-align: center;
          font-family: inherit;

          transition:
            all .22s
            cubic-bezier(.34,1.56,.64,1);
        }

        .hero-type-btn:hover:not(.active):not(:disabled) {
          border-color:
            rgba(232,168,56,0.35);

          background:
            rgba(232,168,56,0.04);

          transform:
            translateY(-2px);
        }

        .hero-type-btn.active {
          border-color:
            ${tk.navy};

          background:
            rgba(27,42,74,0.05);

          box-shadow:
            0 4px 16px
            rgba(27,42,74,0.12);

          transform:
            translateY(-2px);
        }

        .hero-type-btn:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .hero-type-icon {
          font-size: ${
            isMobile
              ? '20px'
              : '24px'
          };

          margin-bottom: ${
            isMobile
              ? '3px'
              : '5px'
          };
        }

        .hero-type-label {
          font-size: ${
            isMobile
              ? '10px'
              : '12px'
          };

          font-weight: 600;
          color: ${tk.muted};
        }

        .hero-type-btn.active
        .hero-type-label {
          color: ${tk.navy};
        }

        .hero-drop {
          border:
            2px dashed
            ${tk.border};

          border-radius: 14px;

          padding: ${
            isMobile
              ? '20px 14px'
              : '28px 20px'
          };

          text-align: center;
          cursor: pointer;

          transition:
            all .22s ease;

          background:
            rgba(27,42,74,0.02);

          position: relative;
          overflow: hidden;
        }

        .hero-drop:hover:not(.disabled) {
          border-color:
            rgba(232,168,56,0.4);

          background:
            rgba(232,168,56,0.03);
        }

        .hero-drop.has-file {
          border-color:
            rgba(42,157,143,0.4);

          background:
            rgba(42,157,143,0.03);
        }

        .hero-drop.disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .hero-drop
        input[type=file] {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
        }

        .hero-drop
        input[type=file]:disabled {
          cursor: not-allowed;
        }

        .hero-lbl {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: ${tk.navy};
          margin-bottom: 6px;
          letter-spacing: .3px;
        }

        .hero-lbl-req {
          color: ${tk.gold};
          margin-left: 2px;
        }

        .hero-current-media {
          padding: 14px;
          margin-bottom: 12px;
          border-radius: 14px;
          border:
            1.5px solid
            ${tk.border};
          background: #FAFAFA;
        }

        .hero-current-image {
          display: block;
          width: 100%;
          max-width: 450px;
          max-height: 230px;
          object-fit: cover;
          border-radius: 10px;
          border:
            1px solid
            ${tk.border};
        }

        .hero-current-video {
          display: block;
          width: 100%;
          max-width: 450px;
          max-height: 260px;
          border-radius: 10px;
          background: #000;
        }

        .hero-table-wrap {
          border-radius: ${
            isMobile
              ? '14px'
              : '16px'
          };

          overflow: hidden;

          border:
            1.5px solid
            ${tk.border};

          background:
            ${tk.card};
        }

        .hero-table {
          width: 100%;
          border-collapse: collapse;
        }

        .hero-table th {
          padding: ${
            isMobile
              ? '10px 12px'
              : '12px 14px'
          };

          font-size: 11px;
          font-weight: 700;
          color: ${tk.faint};
          text-transform: uppercase;
          letter-spacing: .8px;
          text-align: left;

          border-bottom:
            1.5px solid
            ${tk.border};

          white-space: nowrap;

          background:
            rgba(27,42,74,0.03);
        }

        .hero-table td {
          padding: ${
            isMobile
              ? '10px 12px'
              : '12px 14px'
          };

          font-size: 13px;
          color: ${tk.muted};

          border-bottom:
            1px solid
            rgba(229,231,235,.6);

          vertical-align: middle;
        }

        .hero-table
        tbody
        tr:last-child
        td {
          border-bottom: none;
        }

        .hero-table
        tbody
        tr:hover
        td {
          background:
            rgba(27,42,74,0.015);
        }

        .hero-thumb {
          width: ${
            isMobile
              ? '54px'
              : '68px'
          };

          height: ${
            isMobile
              ? '34px'
              : '43px'
          };

          border-radius: 8px;
          object-fit: cover;

          border:
            1.5px solid
            ${tk.border};

          flex-shrink: 0;
        }

        .hero-thumb-ph {
          width: ${
            isMobile
              ? '54px'
              : '68px'
          };

          height: ${
            isMobile
              ? '34px'
              : '43px'
          };

          border-radius: 8px;

          background:
            rgba(27,42,74,0.06);

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: ${
            isMobile
              ? '18px'
              : '22px'
          };

          flex-shrink: 0;

          border:
            1.5px solid
            ${tk.border};
        }

        .hero-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 6px;
        }

        .hero-edit-btn {
          font-size: 12px;
          font-weight: 600;

          color:
            ${tk.navy};

          background:
            rgba(27,42,74,0.06);

          border:
            1.5px solid
            rgba(27,42,74,0.12);

          cursor: pointer;

          padding:
            5px 12px;

          border-radius: 8px;

          transition:
            all .2s;

          font-family: inherit;

          white-space: nowrap;
        }

        .hero-edit-btn:hover:not(:disabled) {
          background:
            rgba(27,42,74,0.11);

          border-color:
            rgba(27,42,74,0.20);
        }

        .hero-edit-btn:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .hero-del-btn {
          font-size: ${
            isMobile
              ? '11px'
              : '12px'
          };

          font-weight: 600;
          color: #ef4444;

          background: none;

          border:
            1.5px solid
            transparent;

          cursor: pointer;

          padding: ${
            isMobile
              ? '5px 8px'
              : '5px 12px'
          };

          border-radius: 8px;

          transition:
            all .2s;

          font-family: inherit;

          white-space: nowrap;
        }

        .hero-del-btn:hover:not(:disabled) {
          background:
            rgba(239,68,68,0.07);

          border-color:
            rgba(239,68,68,0.2);
        }

        .hero-del-btn:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .hero-slide-card {
          display: flex;
          gap: 10px;
          align-items: center;

          padding: 12px;

          border-radius: 12px;

          background: #FAFAFA;

          border:
            1.5px solid
            ${tk.border};
        }

        .hero-slide-card:not(:last-child) {
          margin-bottom: 10px;
        }
      `}</style>

      <div className="hero-pg">
        {/* =========================
            HEADER
        ========================= */}

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent:
              'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily:
                  'Playfair Display,serif',

                fontWeight: 800,

                fontSize:
                  isMobile
                    ? '20px'
                    : 'clamp(18px,3vw,24px)',

                color: tk.text,

                marginBottom:
                  '4px',
              }}
            >
              🎞️ Hero Carousel
            </h1>

            <p
              style={{
                color: tk.muted,
                fontSize: '13px',
              }}
            >
              Manage homepage hero
              slides

              {!loading && (
                <span
                  style={{
                    color:
                      tk.gold,

                    fontWeight:
                      600,

                    marginLeft:
                      '6px',
                  }}
                >
                  ({slides.length}{' '}
                  slides)
                </span>
              )}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={
                fetchSlides
              }
              disabled={
                loading ||
                saving
              }
              className="adm-btn-secondary"
            >
              <span
                style={{
                  display:
                    'inline-block',

                  animation:
                    loading
                      ? 'spin 1s linear infinite'
                      : 'none',
                }}
              >
                🔄
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  showForm
                ) {
                  resetForm()
                  setShowForm(
                    false
                  )
                } else {
                  handleAddNew()
                }
              }}
              disabled={saving}
              className="adm-btn-primary"
            >
              {showForm
                ? '✕ Close'
                : '+ Add Slide'}
            </button>
          </div>
        </div>

        {/* =========================
            ADD / EDIT FORM
        ========================= */}

        {showForm && (
          <div
            className="adm-card"
            style={{
              position:
                'relative',

              paddingTop:
                '24px',

              overflow:
                'hidden',

              animation:
                'slideDown .3s ease both',
            }}
          >
            <div
              style={{
                position:
                  'absolute',

                top: 0,
                left: 0,
                right: 0,

                height: '3px',

                background: `linear-gradient(
                  90deg,
                  ${tk.navy},
                  ${tk.gold},
                  ${tk.navy}
                )`,

                backgroundSize:
                  '200% 100%',

                animation:
                  'shimmer 2.5s linear infinite',
              }}
            />

            <h3
              style={{
                fontWeight: 700,
                color: tk.text,
                fontSize: '15px',
                marginBottom:
                  '20px',

                display: 'flex',
                alignItems:
                  'center',

                gap: '8px',
              }}
            >
              {editingId
                ? '✏️ Edit Hero Slide'
                : '🎞️ Add Hero Slide'}
            </h3>

            <form
              onSubmit={
                handleSave
              }
              style={{
                display: 'flex',

                flexDirection:
                  'column',

                gap: '18px',
              }}
            >
              {/* ===================
                  STEP 1
              =================== */}

              <div>
                <div
                  style={{
                    display:
                      'flex',

                    alignItems:
                      'center',

                    gap: '8px',

                    marginBottom:
                      '10px',
                  }}
                >
                  <div
                    style={{
                      width: '4px',
                      height:
                        '18px',

                      borderRadius:
                        '2px',

                      background:
                        tk.gold,
                    }}
                  />

                  <span
                    style={{
                      fontSize:
                        '11px',

                      fontWeight:
                        700,

                      color:
                        tk.faint,

                      textTransform:
                        'uppercase',

                      letterSpacing:
                        '.7px',
                    }}
                  >
                    Step 1 — Choose
                    Type
                  </span>
                </div>

                <div
                  style={{
                    display:
                      'grid',

                    gridTemplateColumns:
                      'repeat(3,1fr)',

                    gap:
                      isMobile
                        ? '8px'
                        : '10px',
                  }}
                >
                  {Object.entries(
                    TYPE_CONFIG
                  ).map(
                    ([id, c]) => (
                      <button
                        key={id}
                        type="button"
                        disabled={
                          saving
                        }
                        className={`hero-type-btn ${
                          form.type ===
                          id
                            ? 'active'
                            : ''
                        }`}
                        onClick={() =>
                          handleTypeChange(
                            id
                          )
                        }
                      >
                        <div className="hero-type-icon">
                          {c.icon}
                        </div>

                        <div className="hero-type-label">
                          {c.label}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* ===================
                  STEP 2
              =================== */}

              <div>
                <div
                  style={{
                    display:
                      'flex',

                    alignItems:
                      'center',

                    gap: '8px',

                    marginBottom:
                      '10px',
                  }}
                >
                  <div
                    style={{
                      width: '4px',
                      height:
                        '18px',

                      borderRadius:
                        '2px',

                      background:
                        tk.gold,
                    }}
                  />

                  <span
                    style={{
                      fontSize:
                        '11px',

                      fontWeight:
                        700,

                      color:
                        tk.faint,

                      textTransform:
                        'uppercase',

                      letterSpacing:
                        '.7px',
                    }}
                  >
                    Step 2 —
                    Details
                  </span>
                </div>

                <div
                  style={{
                    display:
                      'grid',

                    gridTemplateColumns:
                      isMobile
                        ? '1fr'
                        : '1fr auto',

                    gap: '10px',

                    alignItems:
                      'end',
                  }}
                >
                  <div>
                    <label className="hero-lbl">
                      Title

                      <span className="hero-lbl-req">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      className="adm-input"
                      placeholder={
                        form.type ===
                        'image'
                          ? 'e.g. Welcome to LDCE Portal'
                          : form.type ===
                              'video'
                            ? 'e.g. Course Introduction'
                            : 'e.g. Latest Notification'
                      }
                      value={
                        form.title
                      }
                      onChange={(
                        e
                      ) =>
                        setForm(
                          (f) => ({
                            ...f,

                            title:
                              e
                                .target
                                .value,
                          })
                        )
                      }
                      disabled={
                        saving
                      }
                      required
                    />
                  </div>

                  <div
                    style={{
                      minWidth:
                        isMobile
                          ? 'auto'
                          : '80px',
                    }}
                  >
                    <label className="hero-lbl">
                      Order
                    </label>

                    <input
                      type="number"
                      className="adm-input"
                      value={
                        form.order
                      }
                      min={0}
                      onChange={(
                        e
                      ) =>
                        setForm(
                          (f) => ({
                            ...f,

                            order:
                              parseInt(
                                e
                                  .target
                                  .value
                              ) ||
                              0,
                          })
                        )
                      }
                      disabled={
                        saving
                      }
                    />
                  </div>
                </div>
              </div>

              {/* ===================
                  STEP 3
              =================== */}

              <div>
                <div
                  style={{
                    display:
                      'flex',

                    alignItems:
                      'center',

                    gap: '8px',

                    marginBottom:
                      '10px',
                  }}
                >
                  <div
                    style={{
                      width: '4px',
                      height:
                        '18px',

                      borderRadius:
                        '2px',

                      background:
                        tk.gold,
                    }}
                  />

                  <span
                    style={{
                      fontSize:
                        '11px',

                      fontWeight:
                        700,

                      color:
                        tk.faint,

                      textTransform:
                        'uppercase',

                      letterSpacing:
                        '.7px',
                    }}
                  >
                    Step 3 — Media
                  </span>
                </div>

                {/* CURRENT MEDIA */}

                {editingId &&
                  form.existingMediaUrl &&
                  !form.media && (
                    <div className="hero-current-media">
                      <p
                        style={{
                          margin:
                            '0 0 10px',

                          fontSize:
                            '11px',

                          fontWeight:
                            700,

                          color:
                            tk.faint,

                          textTransform:
                            'uppercase',

                          letterSpacing:
                            '.6px',
                        }}
                      >
                        Current Media
                      </p>

                      {form.type ===
                      'video' ? (
                        <video
                          src={
                            form.existingMediaUrl
                          }
                          controls
                          preload="metadata"
                          className="hero-current-video"
                        />
                      ) : (
                        <img
                          src={
                            form.existingMediaUrl
                          }
                          alt="Current hero media"
                          className="hero-current-image"
                        />
                      )}

                      <p
                        style={{
                          margin:
                            '10px 0 0',

                          fontSize:
                            '11px',

                          color:
                            tk.muted,
                        }}
                      >
                        Keep this
                        media or select
                        a new file below
                        to replace it.
                      </p>
                    </div>
                  )}

                {/* UPLOAD BOX */}

                <div
                  className={`hero-drop ${
                    form.media
                      ? 'has-file'
                      : ''
                  } ${
                    saving
                      ? 'disabled'
                      : ''
                  }`}
                >
                  <input
                    type="file"
                    accept={
                      cfg.accept
                    }
                    disabled={
                      saving
                    }
                    onChange={
                      handleFileChange
                    }
                  />

                  {!form.media ? (
                    <>
                      <div
                        style={{
                          fontSize:
                            isMobile
                              ? '28px'
                              : '36px',

                          marginBottom:
                            '8px',
                        }}
                      >
                        {form.type ===
                        'video'
                          ? '🎬'
                          : '🖼️'}
                      </div>

                      <p
                        style={{
                          fontSize:
                            '13px',

                          fontWeight:
                            600,

                          color:
                            tk.text,

                          marginBottom:
                            '5px',
                        }}
                      >
                        {editingId
                          ? `Click to replace ${cfg.label.toLowerCase()}`
                          : `Click to upload ${cfg.label.toLowerCase()}`}
                      </p>

                      <p
                        style={{
                          fontSize:
                            '11px',

                          color:
                            tk.faint,
                        }}
                      >
                        {cfg.hint}
                      </p>

                      {editingId &&
                        form.existingMediaUrl && (
                          <p
                            style={{
                              marginTop:
                                '5px',

                              fontSize:
                                '10px',

                              color:
                                tk.teal,

                              fontWeight:
                                600,
                            }}
                          >
                            Optional —
                            existing media
                            will be kept
                          </p>
                        )}
                    </>
                  ) : (
                    <div
                      style={{
                        pointerEvents:
                          'none',
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            isMobile
                              ? '26px'
                              : '32px',

                          marginBottom:
                            '6px',
                        }}
                      >
                        ✅
                      </div>

                      <p
                        style={{
                          fontSize:
                            '13px',

                          fontWeight:
                            600,

                          color:
                            tk.teal,
                        }}
                      >
                        New file selected
                        — click to replace
                      </p>

                      <p
                        style={{
                          fontSize:
                            '11px',

                          color:
                            tk.faint,

                          marginTop:
                            '3px',
                        }}
                      >
                        {
                          form.media
                            .name
                        }{' '}
                        (
                        {fmtSize(
                          form.media
                            .size
                        )}
                        )
                      </p>
                    </div>
                  )}
                </div>

                {/* IMAGE PREVIEW */}

                {form.mediaPreview && (
                  <div
                    style={{
                      marginTop:
                        '10px',

                      position:
                        'relative',

                      display:
                        'inline-block',
                    }}
                  >
                    <img
                      src={
                        form.mediaPreview
                      }
                      alt="Preview"
                      style={{
                        display:
                          'block',

                        height:
                          isMobile
                            ? '80px'
                            : '100px',

                        maxWidth:
                          '100%',

                        objectFit:
                          'cover',

                        borderRadius:
                          '10px',

                        border: `1.5px solid ${tk.border}`,
                      }}
                    />

                    <button
                      type="button"
                      onClick={
                        removeSelectedFile
                      }
                      disabled={
                        saving
                      }
                      style={{
                        position:
                          'absolute',

                        top: '5px',
                        right:
                          '5px',

                        width:
                          '22px',

                        height:
                          '22px',

                        borderRadius:
                          '50%',

                        background:
                          'rgba(0,0,0,0.65)',

                        border:
                          'none',

                        color:
                          '#fff',

                        fontSize:
                          '11px',

                        cursor:
                          'pointer',

                        display:
                          'flex',

                        alignItems:
                          'center',

                        justifyContent:
                          'center',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* VIDEO FILE */}

                {form.media &&
                  !form.mediaPreview && (
                    <div
                      style={{
                        marginTop:
                          '10px',

                        display:
                          'inline-flex',

                        alignItems:
                          'center',

                        gap: '8px',

                        padding:
                          '8px 14px',

                        borderRadius:
                          '10px',

                        background:
                          'rgba(27,42,74,0.05)',

                        border: `1.5px solid ${tk.border}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize:
                            '16px',
                        }}
                      >
                        🎬
                      </span>

                      <div>
                        <p
                          style={{
                            fontSize:
                              '12px',

                            fontWeight:
                              600,

                            color:
                              tk.text,

                            margin:
                              0,
                          }}
                        >
                          {
                            form.media
                              .name
                          }
                        </p>

                        <p
                          style={{
                            fontSize:
                              '11px',

                            color:
                              tk.faint,

                            margin:
                              '2px 0 0',
                          }}
                        >
                          {fmtSize(
                            form.media
                              .size
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          removeSelectedFile
                        }
                        disabled={
                          saving
                        }
                        style={{
                          background:
                            'none',

                          border:
                            'none',

                          color:
                            '#ef4444',

                          cursor:
                            'pointer',

                          fontSize:
                            '13px',

                          fontWeight:
                            700,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
              </div>

              {/* PROGRESS */}

              {saving && (
                <UploadProgress
                  progress={Math.round(
                    progress
                  )}
                  isVideo={
                    form.type ===
                    'video'
                  }
                  editing={
                    Boolean(
                      editingId
                    )
                  }
                />
              )}

              {/* ACTIONS */}

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="submit"
                  disabled={saving}
                  className="adm-btn-primary"
                  style={{
                    padding:
                      isMobile
                        ? '10px 20px'
                        : '12px 28px',

                    flex:
                      isMobile
                        ? 1
                        : 'none',
                  }}
                >
                  {saving ? (
                    <>
                      <svg
                        style={{
                          width:
                            '13px',

                          height:
                            '13px',

                          animation:
                            'spin 1s linear infinite',

                          display:
                            'inline-block',

                          marginRight:
                            '6px',

                          verticalAlign:
                            'middle',
                        }}
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          style={{
                            opacity:
                              0.25,
                          }}
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />

                        <path
                          style={{
                            opacity:
                              0.75,
                          }}
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>

                      {editingId
                        ? 'Updating…'
                        : 'Uploading…'}
                    </>
                  ) : editingId ? (
                    '✓ Update Hero Slide'
                  ) : (
                    '+ Add Hero Slide'
                  )}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    resetForm()
                    setShowForm(
                      false
                    )
                  }}
                  className="adm-btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================
            SLIDES LIST
        ========================= */}

        <div className="hero-table-wrap">
          {loading ? (
            <div
              style={{
                padding: '48px',
                textAlign:
                  'center',
              }}
            >
              <svg
                style={{
                  width: '28px',
                  height:
                    '28px',

                  color:
                    tk.gold,

                  animation:
                    'spin 1s linear infinite',

                  margin:
                    '0 auto 10px',

                  display:
                    'block',
                }}
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  style={{
                    opacity:
                      0.25,
                  }}
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />

                <path
                  style={{
                    opacity:
                      0.75,
                  }}
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>

              <p
                style={{
                  color:
                    tk.faint,

                  fontSize:
                    '13px',
                }}
              >
                Loading slides…
              </p>
            </div>
          ) : slides.length ===
            0 ? (
            <div
              style={{
                padding:
                  '52px 24px',

                textAlign:
                  'center',

                display:
                  'flex',

                flexDirection:
                  'column',

                alignItems:
                  'center',

                gap: '10px',
              }}
            >
              <span
                style={{
                  fontSize:
                    '44px',
                }}
              >
                🎞️
              </span>

              <p
                style={{
                  color:
                    tk.muted,

                  fontWeight:
                    600,
                }}
              >
                No hero slides yet
              </p>

              <p
                style={{
                  color:
                    tk.faint,

                  fontSize:
                    '12px',
                }}
              >
                Add your first slide
                above
              </p>
            </div>
          ) : isMobile ? (
            /* =====================
               MOBILE
            ===================== */

            <div
              style={{
                padding:
                  '12px',

                display:
                  'flex',

                flexDirection:
                  'column',

                gap: '10px',
              }}
            >
              {slides.map(
                (slide) => {
                  const c =
                    TYPE_CONFIG[
                      slide.type
                    ] ||
                    TYPE_CONFIG.image

                  const id =
                    slide._id ||
                    slide.id

                  return (
                    <div
                      key={id}
                      className="hero-slide-card"
                    >
                      {slide.type ===
                      'video' ? (
                        <div className="hero-thumb-ph">
                          🎬
                        </div>
                      ) : slide.mediaUrl ? (
                        <img
                          src={
                            slide.mediaUrl
                          }
                          alt=""
                          className="hero-thumb"
                        />
                      ) : (
                        <div className="hero-thumb-ph">
                          {c.icon}
                        </div>
                      )}

                      <div
                        style={{
                          flex: 1,
                          minWidth:
                            0,
                        }}
                      >
                        <p
                          style={{
                            fontSize:
                              '13px',

                            fontWeight:
                              600,

                            color:
                              tk.text,

                            overflow:
                              'hidden',

                            textOverflow:
                              'ellipsis',

                            whiteSpace:
                              'nowrap',

                            margin:
                              0,
                          }}
                        >
                          {slide.title ||
                            '—'}
                        </p>

                        <div
                          style={{
                            display:
                              'flex',

                            gap:
                              '6px',

                            marginTop:
                              '4px',

                            flexWrap:
                              'wrap',

                            alignItems:
                              'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize:
                                '10px',

                              fontWeight:
                                700,

                              padding:
                                '2px 8px',

                              borderRadius:
                                '6px',

                              background:
                                c
                                  .badge
                                  .bg,

                              color:
                                c
                                  .badge
                                  .color,
                            }}
                          >
                            {c.icon}{' '}
                            {c.label}
                          </span>

                          <span
                            style={{
                              fontSize:
                                '10px',

                              color:
                                slide.isActive
                                  ? tk.teal
                                  : tk.faint,

                              fontWeight:
                                600,
                            }}
                          >
                            #
                            {
                              slide.order
                            }{' '}

                            {slide.isActive
                              ? '● Active'
                              : '○ Hidden'}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display:
                            'flex',

                          gap:
                            '5px',

                          flexShrink:
                            0,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(
                              slide
                            )
                          }
                          disabled={
                            saving ||
                            deleting ===
                              id
                          }
                          style={{
                            background:
                              'rgba(27,42,74,0.07)',

                            border:
                              '1px solid rgba(27,42,74,0.14)',

                            color:
                              tk.navy,

                            padding:
                              '7px 10px',

                            borderRadius:
                              '9px',

                            cursor:
                              'pointer',

                            fontSize:
                              '13px',
                          }}
                          title="Edit"
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              id
                            )
                          }
                          disabled={
                            deleting ===
                            id
                          }
                          style={{
                            background:
                              'rgba(239,68,68,0.08)',

                            border:
                              '1px solid rgba(239,68,68,0.15)',

                            color:
                              '#ef4444',

                            padding:
                              '7px 10px',

                            borderRadius:
                              '9px',

                            cursor:
                              'pointer',

                            fontSize:
                              '14px',

                            opacity:
                              deleting ===
                              id
                                ? 0.5
                                : 1,
                          }}
                          title="Delete"
                        >
                          {deleting ===
                          id
                            ? '…'
                            : '🗑️'}
                        </button>
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          ) : (
            /* =====================
               DESKTOP
            ===================== */

            <div
              style={{
                overflowX:
                  'auto',

                WebkitOverflowScrolling:
                  'touch',
              }}
            >
              <table
                className="hero-table"
                style={{
                  minWidth:
                    '600px',
                }}
              >
                <thead>
                  <tr>
                    <th>
                      Slide
                    </th>

                    <th>
                      Type
                    </th>

                    {!isTablet && (
                      <th>
                        Storage
                      </th>
                    )}

                    <th
                      style={{
                        textAlign:
                          'center',
                      }}
                    >
                      Order
                    </th>

                    <th>
                      Status
                    </th>

                    <th
                      style={{
                        textAlign:
                          'right',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {slides.map(
                    (slide) => {
                      const c =
                        TYPE_CONFIG[
                          slide
                            .type
                        ] ||
                        TYPE_CONFIG.image

                      const id =
                        slide._id ||
                        slide.id

                      return (
                        <tr key={id}>
                          <td>
                            <div
                              style={{
                                display:
                                  'flex',

                                alignItems:
                                  'center',

                                gap:
                                  '10px',
                              }}
                            >
                              {slide.type ===
                              'video' ? (
                                <div className="hero-thumb-ph">
                                  🎬
                                </div>
                              ) : slide.mediaUrl ? (
                                <img
                                  src={
                                    slide.mediaUrl
                                  }
                                  alt=""
                                  className="hero-thumb"
                                />
                              ) : (
                                <div className="hero-thumb-ph">
                                  {
                                    c.icon
                                  }
                                </div>
                              )}

                              <p
                                style={{
                                  fontSize:
                                    '13px',

                                  fontWeight:
                                    600,

                                  color:
                                    tk.text,

                                  maxWidth:
                                    '160px',

                                  overflow:
                                    'hidden',

                                  textOverflow:
                                    'ellipsis',

                                  whiteSpace:
                                    'nowrap',

                                  margin:
                                    0,
                                }}
                              >
                                {slide.title ||
                                  '—'}
                              </p>
                            </div>
                          </td>

                          <td>
                            <span
                              style={{
                                display:
                                  'inline-flex',

                                alignItems:
                                  'center',

                                gap:
                                  '4px',

                                padding:
                                  '4px 10px',

                                borderRadius:
                                  '8px',

                                fontSize:
                                  '11px',

                                fontWeight:
                                  700,

                                background:
                                  c
                                    .badge
                                    .bg,

                                color:
                                  c
                                    .badge
                                    .color,
                              }}
                            >
                              {c.icon}{' '}
                              {c.label}
                            </span>
                          </td>

                          {!isTablet && (
                            <td>
                              <span
                                style={{
                                  fontSize:
                                    '11px',

                                  fontWeight:
                                    600,

                                  color:
                                    slide.type ===
                                    'video'
                                      ? tk.teal
                                      : '#3B82F6',
                                }}
                              >
                                {slide.type ===
                                'video'
                                  ? '☁️ R2'
                                  : '🖼️ CDN'}
                              </span>
                            </td>
                          )}

                          <td
                            style={{
                              textAlign:
                                'center',
                            }}
                          >
                            <span
                              style={{
                                background:
                                  'rgba(27,42,74,0.05)',

                                borderRadius:
                                  '6px',

                                padding:
                                  '3px 10px',

                                fontSize:
                                  '12px',

                                fontWeight:
                                  600,

                                color:
                                  tk.muted,
                              }}
                            >
                              {
                                slide.order
                              }
                            </span>
                          </td>

                          <td>
                            <span
                              style={{
                                display:
                                  'inline-flex',

                                alignItems:
                                  'center',

                                gap:
                                  '5px',

                                fontSize:
                                  '11px',

                                fontWeight:
                                  700,

                                color:
                                  slide.isActive
                                    ? tk.teal
                                    : tk.faint,
                              }}
                            >
                              <span
                                style={{
                                  width:
                                    '6px',

                                  height:
                                    '6px',

                                  borderRadius:
                                    '50%',

                                  background:
                                    slide.isActive
                                      ? tk.teal
                                      : tk.faint,
                                }}
                              />

                              {slide.isActive
                                ? 'Active'
                                : 'Hidden'}
                            </span>
                          </td>

                          <td
                            style={{
                              textAlign:
                                'right',
                            }}
                          >
                            <div className="hero-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    slide
                                  )
                                }
                                disabled={
                                  saving ||
                                  deleting ===
                                    id
                                }
                                className="hero-edit-btn"
                              >
                                ✏️ Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    id
                                  )
                                }
                                disabled={
                                  deleting ===
                                  id
                                }
                                className="hero-del-btn"
                              >
                                {deleting ===
                                id
                                  ? 'Deleting…'
                                  : '🗑️ Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}