import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import QuizCatalog from '@/components/quiz/QuizCatalog'

export const metadata = {
  title: 'Mock Tests | LDCE Warriors',
}

export default function MockTestsPage() {
  return (
    <>
      <Navbar />
      <QuizCatalog mode="MOCK" />
      <Footer />
    </>
  )
}