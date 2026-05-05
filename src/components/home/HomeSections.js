// src/components/home/HomeSections.js
'use client'
import { useState } from 'react'
import VideoCard from '@/components/home/VideoCard'
import VideoPlayerModal from '@/components/ui/VideoPlayerModal'

export default function HomeVideoSection({ freeVideos = [] }) {
  const [selectedVideo, setSelectedVideo] = useState(null)

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
            onClick={setSelectedVideo}
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