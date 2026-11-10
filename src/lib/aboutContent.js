// src/lib/aboutContent.js
// Content of the About Us page. Stored as JSON in the Setting table
// (key "aboutPage") and edited from Admin → About Us.

export const ABOUT_SETTING_KEY = 'aboutPage'

export const SECTION_KEYS = ['hero', 'story', 'missionVision', 'stats', 'features', 'team', 'cta']

export const SECTION_LABELS = {
  hero: 'Top banner',
  story: 'Our story',
  missionVision: 'Mission & vision',
  stats: 'Numbers',
  features: 'Why choose us',
  team: 'Our team',
  cta: 'Call to action',
}

// Numbers the "Numbers" section can count automatically (when the page opens)
export const AUTO_STATS = {
  videos: 'Video lessons (counted automatically)',
  topics: 'Topics (counted automatically)',
  tests: 'Mock tests (counted automatically)',
  textbooks: 'Textbooks (counted automatically)',
  articles: 'Articles (counted automatically)',
}

export const DEFAULT_ABOUT = {
  order: [...SECTION_KEYS],
  hero: {
    show: true,
    eyebrow: 'About LDCE Warriors',
    title: 'Helping railway staff clear their LDCE',
    subtitle: 'Expert video classes, digital textbooks and mock tests for Limited Departmental Competitive Examinations — all in one place.',
    image: '',
  },
  story: {
    show: true,
    heading: 'Our story',
    text: 'LDCE Warriors was started to give railway employees clear, practical preparation for departmental exams.\n\nEdit this text from Admin → About Us to tell your own story.',
    image: '',
  },
  missionVision: {
    show: true,
    missionTitle: 'Our mission',
    mission: 'Make quality LDCE preparation simple, affordable and available anywhere.',
    visionTitle: 'Our vision',
    vision: 'Every aspirant walks into the exam hall confident and well prepared.',
  },
  stats: {
    show: true,
    heading: 'LDCE Warriors in numbers',
    items: [
      { label: 'Video lessons', value: '', auto: 'videos' },
      { label: 'Topics covered', value: '', auto: 'topics' },
      { label: 'Mock tests', value: '', auto: 'tests' },
      { label: 'Digital textbooks', value: '', auto: 'textbooks' },
    ],
  },
  features: {
    show: true,
    heading: 'Why choose us',
    items: [
      { icon: '🎥', title: 'In-depth classes', text: 'Topic-wise video lessons explained step by step.' },
      { icon: '📝', title: 'Mock tests', text: 'Timed tests with answer keys and explanation videos.' },
      { icon: '📘', title: 'Digital textbooks', text: 'Chapter-wise notes you can read anytime.' },
    ],
  },
  team: {
    show: false,
    heading: 'Meet the team',
    subtitle: '',
    members: [],
  },
  cta: {
    show: true,
    title: 'Ready to start preparing?',
    text: 'Join the LDCE Warriors family and get full access to every class, test and textbook.',
    buttonLabel: 'Join Family',
    buttonLink: '/join-family',
  },
}

const str = (v, max = 500) => String(v ?? '').trim().slice(0, max)
const bool = (v, d) => (typeof v === 'boolean' ? v : d)

// Images: our own uploads (/api/media/…, /…) or https links only
function imageUrl(v) {
  const s = str(v, 1000)
  return s.startsWith('/') || s.startsWith('https://') ? s : ''
}

// Links: site pages (/…) or https links only — never javascript: etc.
function linkUrl(v) {
  const s = str(v, 500)
  return s.startsWith('/') || s.startsWith('https://') ? s : '/join-family'
}

// Fill any missing pieces with defaults and clean every value.
// Used both when saving and when reading, so the page never breaks.
export function normalizeAbout(input) {
  const src = input && typeof input === 'object' ? input : {}
  const d = DEFAULT_ABOUT
  const sec = key => (src[key] && typeof src[key] === 'object' ? src[key] : {})

  const order = Array.isArray(src.order)
    ? src.order.filter(k => SECTION_KEYS.includes(k))
    : []
  for (const k of SECTION_KEYS) if (!order.includes(k)) order.push(k)

  const hero = sec('hero')
  const story = sec('story')
  const mv = sec('missionVision')
  const stats = sec('stats')
  const features = sec('features')
  const team = sec('team')
  const cta = sec('cta')

  return {
    order: [...new Set(order)],
    hero: {
      show: bool(hero.show, d.hero.show),
      eyebrow: str(hero.eyebrow ?? d.hero.eyebrow, 80),
      title: str(hero.title ?? d.hero.title, 160),
      subtitle: str(hero.subtitle ?? d.hero.subtitle, 600),
      image: imageUrl(hero.image ?? d.hero.image),
    },
    story: {
      show: bool(story.show, d.story.show),
      heading: str(story.heading ?? d.story.heading, 120),
      text: str(story.text ?? d.story.text, 6000),
      image: imageUrl(story.image ?? d.story.image),
    },
    missionVision: {
      show: bool(mv.show, d.missionVision.show),
      missionTitle: str(mv.missionTitle ?? d.missionVision.missionTitle, 80),
      mission: str(mv.mission ?? d.missionVision.mission, 1500),
      visionTitle: str(mv.visionTitle ?? d.missionVision.visionTitle, 80),
      vision: str(mv.vision ?? d.missionVision.vision, 1500),
    },
    stats: {
      show: bool(stats.show, d.stats.show),
      heading: str(stats.heading ?? d.stats.heading, 120),
      items: (Array.isArray(stats.items) ? stats.items : d.stats.items).slice(0, 12).map(it => ({
        label: str(it?.label, 60),
        value: str(it?.value, 30),
        auto: Object.keys(AUTO_STATS).includes(it?.auto) ? it.auto : '',
      })),
    },
    features: {
      show: bool(features.show, d.features.show),
      heading: str(features.heading ?? d.features.heading, 120),
      items: (Array.isArray(features.items) ? features.items : d.features.items).slice(0, 24).map(it => ({
        icon: str(it?.icon, 8),
        title: str(it?.title, 80),
        text: str(it?.text, 400),
      })),
    },
    team: {
      show: bool(team.show, d.team.show),
      heading: str(team.heading ?? d.team.heading, 120),
      subtitle: str(team.subtitle ?? d.team.subtitle, 300),
      members: (Array.isArray(team.members) ? team.members : []).slice(0, 40).map(m => ({
        name: str(m?.name, 80),
        role: str(m?.role, 80),
        photo: imageUrl(m?.photo),
        bio: str(m?.bio, 500),
      })),
    },
    cta: {
      show: bool(cta.show, d.cta.show),
      title: str(cta.title ?? d.cta.title, 120),
      text: str(cta.text ?? d.cta.text, 400),
      buttonLabel: str(cta.buttonLabel ?? d.cta.buttonLabel, 40),
      buttonLink: linkUrl(cta.buttonLink ?? d.cta.buttonLink),
    },
  }
}
