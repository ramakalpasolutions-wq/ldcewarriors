'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

// The explanation video now lives on the scorecard page.
// Old links to this page are sent there.
export default function ExplanationRedirectPage() {
  const { id } = useParams()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/exam/${id}/results${window.location.search}`)
  }, [id, router])

  return null
}
