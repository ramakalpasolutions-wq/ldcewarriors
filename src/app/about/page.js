import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AboutView from '@/components/about/AboutView'
import { loadAbout, loadLiveCounts } from '@/lib/aboutData'

// Always show the latest saved content
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'About Us — LDCE Warriors',
  description: 'Learn about LDCE Warriors — video classes, digital textbooks and mock tests for Limited Departmental Competitive Examinations.',
}

export default async function AboutPage() {
  const [about, counts] = await Promise.all([loadAbout(), loadLiveCounts()])

  return (
    <>
      <Navbar />
      <main>
        <AboutView about={about} counts={counts} />
      </main>
      <Footer />
    </>
  )
}
