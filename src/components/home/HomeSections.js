// src/components/home/HomeSections.js
'use client'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import VideoCard from '@/components/home/VideoCard'
import VideoPlayerModal from '@/components/ui/VideoPlayerModal'

export default function HomeVideoSection({ freeVideos = [] }) {
  const [selectedVideo, setSelectedVideo] = useState(null)
  const loadingRef = useRef(false)

  // Ask the server for a short-lived link, then open the player
  async function playVideo(video) {
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      const res = await fetch('/api/videos/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video._id || video.id }),
      })
      const data = await res.json()
      if (data.success && data.canPlay && data.streamUrl) {
        setSelectedVideo({ ...video, videoUrl: data.streamUrl })
      } else {
        toast.error(data.error || 'Unable to play video.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      loadingRef.current = false
    }
  }

  if (freeVideos.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px 24px',
        borderRadius: '20px',
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎬</div>
        <p style={{
          color: '#1A1D23',
          fontWeight: 600,
          fontSize: '16px',
          marginBottom: '6px',
        }}>
          Free sample videos coming soon!
        </p>
        <p style={{
          color: '#9CA3AF',
          fontSize: '14px',
        }}>
          Check back later for expert video lectures.
        </p>
      </div>
    )
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '20px',
      }}>
        {freeVideos.map(video => (
          <VideoCard
            key={video._id || video.id}
            video={video}
            onClick={playVideo}
            isSubscribed={false}
          />
        ))}
      </div>
      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </>
  )
}