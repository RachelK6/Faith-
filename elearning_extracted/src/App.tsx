import { useEffect, useState } from 'react'
import { login as apiLogin, getCurrentUser, logout as apiLogout, type CurrentUser } from './api/auth'
import { getPlatformStats, type PlatformStats } from './api/stats'
import { ApiError, hasSession, isInsecureApiUrl } from './api/client'

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'none' | 'student' | 'instructor' | 'admin'
type StudentPage = 'home' | 'courses' | 'lesson' | 'quiz' | 'labs' | 'submissions' | 'grades'
type InstructorPage = 'home' | 'courses' | 'submissions' | 'students' | 'analytics'
type AdminPage = 'home' | 'users' | 'courses' | 'analytics' | 'settings'

// ─── Icons ────────────────────────────────────────────────────────────────────
function Ic({ d, s = 18, w = 1.8 }: { d: string; s?: number; w?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const I = {
  home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  book: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5V5A2.5 2.5 0 016.5 2.5H20v17',
  check: 'M20 6L9 17l-5-5',
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  chart: 'M18 20V10M12 20V4M6 20v-6',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  play: 'M5 3l14 9-14 9V3z',
  award: 'M12 15a7 7 0 100-14 7 7 0 000 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  plus: 'M12 5v14M5 12h14',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  cpu: 'M9 2H15M9 22H15M2 9V15M22 9V15M9 9h6v6H9zM3 9V7a2 2 0 012-2h2M3 15v2a2 2 0 002 2h2M21 9V7a2 2 0 00-2-2h-2M21 15v2a2 2 0 01-2 2h-2',
  trending: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
  flask: 'M8 3h8M8 3v6l-4 9a1 1 0 00.9 1.5h14.2A1 1 0 0018 18l-4-9V3',
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
  git: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  chevRight: 'M9 18l6-6-6-6',
  chevDown: 'M6 9l6 6 6-6',
  x: 'M18 6L6 18M6 6l12 12',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  terminal: 'M4 17l6-6-6-6M12 19h8',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  mortarboard: 'M22 10v6M2 10l10-5 10 5-10 5-10-5zM6 12v5c3 3 9 3 12 0v-5',
  messageSquare: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  fileText: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  flame: 'M12 2c1 3-3 4-3 8a3 3 0 006 0c1-1 1-3 0-4 2 1 3 3 3 6a6 6 0 01-12 0c0-4 3-6 6-10z',
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Tag({ label, variant = 'default' }: { label: string; variant?: 'default' | 'success' | 'warning' | 'danger' | 'muted' | 'primary' | 'info' | 'gold' }) {
  const cls: Record<string, string> = {
    default: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
    danger: 'bg-red-50 text-red-600 ring-1 ring-red-100',
    muted: 'bg-gray-100 text-gray-500',
    primary: 'bg-[#6D4AFF] text-white',
    info: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
    gold: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono tracking-wide ${cls[variant]}`}>{label}</span>
}

function Av({ name, size = 8, dark = false }: { name: string; size?: number; dark?: boolean }) {
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const palette = dark
    ? ['bg-violet-600 text-white', 'bg-emerald-600 text-white', 'bg-amber-600 text-white', 'bg-sky-600 text-white', 'bg-rose-600 text-white']
    : ['bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-sky-100 text-sky-700', 'bg-rose-100 text-rose-700']
  const color = palette[name.charCodeAt(0) % palette.length]
  return <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-xs font-bold ${color} shrink-0`}>{initials}</div>
}

function Bar({ value, max = 100, thin = false, gold = false }: { value: number; max?: number; thin?: boolean; gold?: boolean }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${thin ? 'h-1' : 'h-1.5'}`}>
      <div className={`h-full rounded-full transition-all duration-700 ${gold ? 'bg-amber-500' : 'bg-[#6D4AFF]'}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

// Real video playback for lesson content. Accepts either a direct file URL
// (mp4/webm — rendered with a native <video> tag) or a YouTube/Vimeo link
// (rendered as an embed). Shows a clear placeholder when no video has been
// uploaded yet, instead of pretending content exists.
function VideoPlayer({ url, title }: { url?: string; title: string }) {
  if (!url) {
    return (
      <div className="aspect-video rounded-2xl bg-gray-900 flex flex-col items-center justify-center gap-2 text-white/40">
        <Ic d={I.play} s={28} />
        <span className="text-sm">Video not yet uploaded for this lesson</span>
      </div>
    )
  }
  const embed = getEmbedUrl(url)
  return (
    <div className="aspect-video rounded-2xl overflow-hidden bg-black">
      {embed ? (
        <iframe src={embed} title={title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      ) : (
        <video src={url} controls className="w-full h-full" preload="metadata" />
      )}
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const modules = [
  { id: 1, title: 'HTML Fundamentals', state: 'completed' as const, lessons: 6, lessonList: [
    { id: 1, title: 'Introduction to HTML', type: 'video', done: true, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', duration: '8:24' },
    { id: 2, title: 'Document Structure & Tags', type: 'tutorial', done: true },
    { id: 3, title: 'Forms & Input Elements', type: 'exercise', done: true },
    { id: 4, title: 'Day 1 Lab: Profile Page', type: 'lab', done: true },
    { id: 5, title: 'Module Assessment', type: 'quiz', done: true },
  ]},
  { id: 2, title: 'CSS Fundamentals', state: 'completed' as const, lessons: 5, lessonList: [
    { id: 1, title: 'Selectors & the Cascade', type: 'video', done: true, videoUrl: '', duration: '11:02' },
    { id: 2, title: 'Box Model & Layout', type: 'tutorial', done: true },
    { id: 3, title: 'Flexbox & Grid Systems', type: 'exercise', done: true },
    { id: 4, title: 'Day 2 Lab: Style the Profile', type: 'lab', done: true },
    { id: 5, title: 'Module Assessment', type: 'quiz', done: true },
  ]},
  { id: 3, title: 'JavaScript', state: 'current' as const, lessons: 6, lessonList: [
    { id: 1, title: 'Variables, Types & Scope', type: 'video', done: true, videoUrl: '', duration: '9:47' },
    { id: 2, title: 'Functions & Higher-Order Concepts', type: 'tutorial', done: true },
    { id: 3, title: 'DOM Manipulation', type: 'exercise', done: false },
    { id: 4, title: 'Events & Async Callbacks', type: 'tutorial', done: false },
    { id: 5, title: 'Day 3 Lab: Interactive Page', type: 'lab', done: false },
    { id: 6, title: 'Module Assessment', type: 'quiz', done: false },
  ]},
  { id: 4, title: 'Git & GitHub', state: 'locked' as const, lessons: 4, lessonList: [] },
  { id: 5, title: 'React', state: 'locked' as const, lessons: 7, lessonList: [] },
  { id: 6, title: 'Node.js', state: 'locked' as const, lessons: 6, lessonList: [] },
  { id: 7, title: 'Databases & SQL', state: 'locked' as const, lessons: 5, lessonList: [] },
  { id: 8, title: 'REST API Design', state: 'locked' as const, lessons: 5, lessonList: [] },
  { id: 9, title: 'Final Capstone Project', state: 'locked' as const, lessons: 3, lessonList: [] },
]

const quizQuestions = [
  { id: 1, question: 'Which keyword declares a block-scoped variable in JavaScript?', options: ['var', 'let', 'def', 'dim'], correct: 1 },
  { id: 2, question: 'What does DOM stand for?', options: ['Document Object Model', 'Data Object Method', 'Digital Output Mode', 'Document Oriented Module'], correct: 0 },
  { id: 3, question: 'Which method adds an element to the end of an array?', options: ['push()', 'append()', 'add()', 'insert()'], correct: 0 },
  { id: 4, question: 'What is the correct syntax for an arrow function?', options: ['function() =>', 'const f = () => {}', 'def f():', 'f => function {}'], correct: 1 },
]

const dailyLabs = [
  { id: 1, day: 'Day 1', title: 'Personal Profile Page', tech: 'HTML', deadline: '2025-08-14', status: 'submitted', grade: 92, feedback: 'Excellent semantic structure. Consider adding ARIA landmark roles for accessibility.' },
  { id: 2, day: 'Day 2', title: 'Style the Profile Page', tech: 'CSS', deadline: '2025-08-15', status: 'submitted', grade: 88, feedback: 'Strong use of Flexbox. Mobile responsiveness requires further refinement.' },
  { id: 3, day: 'Day 3', title: 'Add Interactivity', tech: 'JavaScript', deadline: '2025-09-16', status: 'pending', grade: null, feedback: null },
  { id: 4, day: 'Day 4', title: 'Form Validation', tech: 'JavaScript', deadline: '2025-09-17', status: 'upcoming', grade: null, feedback: null },
]

const submissions = [
  { id: 1, activity: 'Day 1 Lab: Profile Page', type: 'lab', submitted: 'Aug 14, 2025', attempts: '1/1', status: 'graded', grade: 92, feedback: 'Excellent semantic structure. Consider ARIA roles.', github: 'github.com/alexchen/lab-day1' },
  { id: 2, activity: 'HTML Module Assessment', type: 'quiz', submitted: 'Aug 14, 2025', attempts: '1/2', status: 'graded', grade: 85, feedback: 'Review question 4 on DOCTYPE declarations.', github: null },
  { id: 3, activity: 'Day 2 Lab: Style Profile', type: 'lab', submitted: 'Aug 15, 2025', attempts: '1/1', status: 'graded', grade: 88, feedback: 'Mobile breakpoints need work.', github: 'github.com/alexchen/lab-day2' },
  { id: 4, activity: 'Day 3 Lab: Interactivity', type: 'lab', submitted: '—', attempts: '0/1', status: 'pending', grade: null, feedback: null, github: null },
]

const instStudents = [
  { name: 'Alexandra Chen', email: 'a.chen@optimum.edu', progress: 68, lastActive: '2h ago', lab: 'pending', risk: false, grade: 88 },
  { name: 'Jordan Lee', email: 'j.lee@optimum.edu', progress: 92, lastActive: '1h ago', lab: 'submitted', risk: false, grade: 94 },
  { name: 'Priya Nair', email: 'p.nair@optimum.edu', progress: 18, lastActive: '5d ago', lab: 'missing', risk: true, grade: 61 },
  { name: 'Samuel Rivera', email: 's.rivera@optimum.edu', progress: 45, lastActive: '1d ago', lab: 'pending', risk: false, grade: 76 },
  { name: 'Taylor Morgan', email: 't.morgan@optimum.edu', progress: 12, lastActive: '8d ago', lab: 'missing', risk: true, grade: 55 },
  { name: 'Dana Osei', email: 'd.osei@optimum.edu', progress: 80, lastActive: '3h ago', lab: 'submitted', risk: false, grade: 91 },
]

const pendingSubs = [
  { student: 'Alexandra Chen', activity: 'Day 3 Lab: Interactivity', type: 'lab', submitted: 'Sep 15, 2025', attempts: '1/1', github: 'github.com/alexchen/lab-day3' },
  { student: 'Jordan Lee', activity: 'JavaScript Assessment', type: 'quiz', submitted: 'Sep 15, 2025', attempts: '2/2', github: null },
  { student: 'Samuel Rivera', activity: 'Day 3 Lab: Interactivity', type: 'lab', submitted: 'Sep 14, 2025', attempts: '1/1', github: 'github.com/sam/lab-day3' },
]

// ═══════════════════════════════════════════════════════════════════════════════
// PORTAL SELECTION
// ═══════════════════════════════════════════════════════════════════════════════

const PORTAL_META: Record<Exclude<Role, 'none'>, { title: string; subtitle: string; icon: string; accent: string; accentLight: string; features: string[] }> = {
  student: {
    title: 'Student Portal',
    subtitle: 'Access your courses, labs, assessments, and track your progress.',
    icon: I.mortarboard,
    accent: '#6D4AFF',
    accentLight: '#EDE9FF',
    features: ['Course modules & lessons', 'Live code editor', 'Lab submissions', 'Grades & feedback'],
  },
  instructor: {
    title: 'Instructor Portal',
    subtitle: 'Design curriculum, review submissions, grade work, and guide your cohort.',
    icon: I.layers,
    accent: '#0F766E',
    accentLight: '#F0FDF4',
    features: ['Course management', 'Submission grading', 'Student monitoring', 'Performance analytics'],
  },
  admin: {
    title: 'Administrator Portal',
    subtitle: 'Manage users, courses, and institutional settings.',
    icon: I.shield,
    accent: '#1D4ED8',
    accentLight: '#EFF6FF',
    features: ['User & role management', 'Course oversight', 'Platform analytics', 'System configuration'],
  },
}

function StatCell({ label, value, loading, failed }: { label: string; value?: number; loading: boolean; failed: boolean }) {
  return (
    <div className="text-center min-w-[64px]">
      {loading ? (
        <div className="h-9 w-10 mx-auto rounded bg-white/15 animate-pulse" />
      ) : failed ? (
        <div className="text-2xl font-bold text-violet-300 font-mono">—</div>
      ) : (
        <div className="text-4xl font-bold text-white font-mono">{value}</div>
      )}
      <div className="text-xs text-violet-300 mt-1 uppercase tracking-wider font-semibold">{label}</div>
    </div>
  )
}

function LoginPanel({ role, onCancel, onSuccess }: { role: Exclude<Role, 'none'>; onCancel: () => void; onSuccess: (u: CurrentUser) => void }) {
  const meta = PORTAL_META[role]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await apiLogin(email, password)
      if (user.role !== role) {
        setError(`This account is registered as ${user.role}, not ${role}. Sign in from the ${user.role} portal instead.`)
        setLoading(false)
        return
      }
      onSuccess(user)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="px-12 py-12 max-w-md mx-auto w-full">
      <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-8 transition-colors">
        <span className="rotate-180"><Ic d={I.arrowRight} s={14} /></span> Back to portal selection
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: meta.accent }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={meta.icon} /></svg>
        </div>
        <div>
          <div className="font-bold text-lg text-gray-900 leading-none">{meta.title}</div>
          <div className="text-xs text-gray-500 mt-1">Sign in with your Optimum LMS account</div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email</label>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6D4AFF] transition-colors" placeholder="you@optimum.edu" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Password</label>
          <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6D4AFF] transition-colors" placeholder="••••••••" />
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>}
        <button type="submit" disabled={loading}
          className="mt-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
          style={{ background: meta.accent }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

function PortalSelect({ onSelect }: { onSelect: (u: CurrentUser) => void }) {
  const [activeLogin, setActiveLogin] = useState<Exclude<Role, 'none'> | null>(null)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsFailed, setStatsFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    getPlatformStats()
      .then(s => { if (!cancelled) setStats(s) })
      .catch(() => { if (!cancelled) setStatsFailed(true) })
      .finally(() => { if (!cancelled) setStatsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const portals = (Object.keys(PORTAL_META) as Exclude<Role, 'none'>[]).map(role => ({ role, ...PORTAL_META[role] }))

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-12 py-5 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#6D4AFF] flex items-center justify-center">
            <Ic d={I.cpu} s={17} w={1.5} />
          </div>
          <div>
            <span className="text-gray-900 font-bold text-lg tracking-tight">Optimum</span>
            <span className="text-[#6D4AFF] font-bold text-lg tracking-tight"> LMS</span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statsFailed ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${statsFailed ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <span className={`text-xs font-semibold ${statsFailed ? 'text-red-700' : 'text-emerald-700'}`}>{statsFailed ? 'Backend unreachable' : 'All systems operational'}</span>
          </div>
          <span className="text-xs text-gray-500">Academic Year 2025 — 2026</span>
        </div>
      </header>

      {/* Hero band */}
      <div className="bg-[#6D4AFF] px-12 py-14">
        <div className="max-w-7xl mx-auto flex items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-xs text-white font-semibold mb-5">
              <Ic d={I.mortarboard} s={12} />
              Optimum Computer Systems Ltd
            </div>
            <h1 className="text-5xl font-bold text-white leading-tight tracking-tight">
              Sign in to Optimum LMS.
            </h1>
            <p className="text-violet-200 mt-3 text-base leading-relaxed max-w-lg">
              Lessons, daily labs, quizzes, and grades for the Optimum coding curriculum — HTML through capstone — tracked module by module.
            </p>
          </div>
          {/* Live platform stats */}
          <div className="flex gap-10 pb-1">
            <StatCell label="Courses" value={stats?.courses} loading={statsLoading} failed={statsFailed} />
            <StatCell label="Students" value={stats?.students} loading={statsLoading} failed={statsFailed} />
            <StatCell label="Modules" value={stats?.modules} loading={statsLoading} failed={statsFailed} />
            <StatCell label="Instructors" value={stats?.instructors} loading={statsLoading} failed={statsFailed} />
          </div>
        </div>
      </div>

      {activeLogin ? (
        <LoginPanel role={activeLogin} onCancel={() => setActiveLogin(null)} onSuccess={onSelect} />
      ) : (
        <div className="px-12 py-12 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-lg font-bold text-gray-900">Select your portal</h2>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-500">3 roles available</span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {portals.map(p => (
              <button key={p.role} onClick={() => setActiveLogin(p.role)}
                className="group text-left rounded-2xl overflow-hidden border border-gray-200 hover:border-transparent hover:shadow-2xl hover:shadow-gray-200 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                {/* Coloured header band */}
                <div className="px-7 py-6 flex items-center justify-between" style={{ background: p.accent }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white"
                        strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={p.icon} /></svg>
                    </div>
                    <div>
                      <div className="text-white font-bold text-base leading-none">{p.title}</div>
                      <div className="text-white/60 text-[11px] uppercase tracking-wider mt-1">{p.role}</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors flex items-center justify-center text-white">
                    <Ic d={I.arrowRight} s={14} w={2} />
                  </div>
                </div>

                {/* White body */}
                <div className="bg-white px-7 py-6 flex flex-col gap-5 flex-1">
                  <p className="text-gray-700 text-sm leading-relaxed">{p.subtitle}</p>
                  <div className="flex flex-col gap-2.5">
                    {p.features.map(f => (
                      <div key={f} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: p.accentLight }}>
                          <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={p.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d={I.check} /></svg>
                        </div>
                        <span className="text-sm text-gray-700 font-medium">{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: p.accent }}>Sign in</span>
                    <div className="flex items-center gap-1" style={{ color: p.accent }}>
                      <Ic d={I.arrowRight} s={14} w={2} />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-auto border-t border-gray-200">
        <div className="px-12 py-10 max-w-7xl mx-auto w-full grid grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-[#6D4AFF] flex items-center justify-center"><Ic d={I.cpu} s={12} w={1.5} /></div>
              <span className="font-bold text-sm text-gray-900">Optimum LMS</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Coding education platform built and operated by Optimum Computer Systems Ltd, Nairobi.</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Support</div>
            <div className="flex flex-col gap-2 text-xs text-gray-500">
              <a href="mailto:support@optimumsystems.co.ke" className="hover:text-[#6D4AFF] transition-colors">support@optimumsystems.co.ke</a>
              <a href="#" className="hover:text-[#6D4AFF] transition-colors">Help centre</a>
              <a href="#" className="hover:text-[#6D4AFF] transition-colors">Report an issue</a>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Legal</div>
            <div className="flex flex-col gap-2 text-xs text-gray-500">
              <a href="#" className="hover:text-[#6D4AFF] transition-colors">Privacy policy</a>
              <a href="#" className="hover:text-[#6D4AFF] transition-colors">Terms of use</a>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">System</div>
            <div className="flex flex-col gap-2 text-xs text-gray-500">
              <span>Django REST API · React 19 · Vite</span>
              <span>v1.0.0</span>
            </div>
          </div>
        </div>
        <div className="px-12 py-4 border-t border-gray-100 max-w-7xl mx-auto w-full flex items-center justify-between">
          <span className="text-gray-400 text-xs">© 2025 Optimum Computer Systems Ltd · Nairobi, Kenya</span>
        </div>
      </footer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT PORTAL
// ═══════════════════════════════════════════════════════════════════════════════

const STUDENT_NAV = [
  { id: 'home' as StudentPage, label: 'Dashboard', icon: I.home },
  { id: 'courses' as StudentPage, label: 'My Courses', icon: I.book },
  { id: 'labs' as StudentPage, label: 'Daily Labs', icon: I.flask },
  { id: 'submissions' as StudentPage, label: 'Submissions', icon: I.clipboard },
  { id: 'grades' as StudentPage, label: 'Grades', icon: I.award },
]

function StudentSidebar({ page, setPage, onExit, user }: { page: StudentPage; setPage: (p: StudentPage) => void; onExit: () => void; user: CurrentUser }) {
  return (
    <aside className="w-[228px] shrink-0 bg-[#0D0118] flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#6D4AFF] flex items-center justify-center">
            <Ic d={I.cpu} s={15} w={1.5} />
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-tight leading-none">Optimum <span className="text-[#6D4AFF]">LMS</span></div>
            <div className="text-[11px] text-white/30 mt-0.5">Student</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {STUDENT_NAV.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${page === item.id
                ? 'bg-[#6D4AFF] text-white shadow-lg shadow-violet-900/30'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
            <Ic d={item.icon} s={15} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Module progress mini */}
      <div className="px-4 mx-3 mb-3 bg-white/5 rounded-xl p-4">
        <div className="text-[11px] text-white/30 font-semibold mb-2">Current progress</div>
        <div className="text-white font-semibold text-sm mb-1">Module 3 / 9</div>
        <div className="text-white/40 text-xs mb-2.5">JavaScript</div>
        <Bar value={33} thin />
        <div className="text-white/30 text-[11px] font-mono mt-1.5">2 of 6 lessons</div>
      </div>

      {/* User */}
      <div className="px-4 pb-5 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3">
          <Av name={user.name} size={8} dark />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user.name}</div>
            <div className="text-xs text-white/30">{user.studentId ? `ID: ${user.studentId}` : user.email}</div>
          </div>
          <button onClick={onExit} className="text-white/20 hover:text-white/50 transition-colors"><Ic d={I.logout} s={14} /></button>
        </div>
      </div>
    </aside>
  )
}

function StudentTopBar({ title, sub, user }: { title: string; sub?: string; user: CurrentUser }) {
  return (
    <div className="h-16 border-b border-gray-100 px-8 flex items-center justify-between shrink-0 bg-white">
      <div>
        <h1 className="font-bold text-[#0D0118] text-lg tracking-tight">{title}</h1>
        {sub && <p className="text-gray-400 text-xs mt-0.5">{sub}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Ic d={I.bell} s={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#6D4AFF]" />
        </button>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex items-center gap-2.5">
          <Av name={user.name} size={8} />
          <div className="text-sm font-semibold text-[#0D0118]">{user.name}</div>
        </div>
      </div>
    </div>
  )
}

function SCard({ label, value, sub, icon, accent = false }: { label: string; value: string | number; sub?: string; icon: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-4 ${accent ? 'bg-[#6D4AFF] text-white' : 'bg-white border border-gray-100'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${accent ? 'text-violet-200' : 'text-gray-400'}`}>{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ? 'bg-white/20' : 'bg-violet-50'}`}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={accent ? 'white' : '#6D4AFF'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
        </div>
      </div>
      <div>
        <div className={`text-2xl font-bold leading-none ${accent ? 'text-white' : 'text-[#0D0118]'}`}>{value}</div>
        {sub && <div className={`text-xs mt-1.5 font-mono ${accent ? 'text-violet-200' : 'text-emerald-600'}`}>{sub}</div>}
      </div>
    </div>
  )
}

function StudentDashboard({ setPage, user }: { setPage: (p: StudentPage) => void; user: CurrentUser }) {
  const firstName = user.name.split(' ')[0]
  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-400 font-medium">Wednesday, September 17 · Academic Year 2025–26</div>
          <h2 className="text-3xl font-bold text-[#0D0118] mt-1 tracking-tight">Welcome back, {firstName}.</h2>
          <p className="text-gray-400 mt-1.5">Full-Stack Web Development · Cohort 2025 · Module 3 of 9</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-2">
            <div className="text-amber-500"><Ic d={I.flame} s={16} w={1.8} /></div>
            <div>
              <div className="text-amber-800 font-bold text-sm">12-day streak</div>
              <div className="text-amber-600 text-[11px]">Keep it up!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <SCard label="Current Module" value="JavaScript" sub="Module 3 / 9" icon={I.book} accent />
        <SCard label="Lessons Completed" value="16 / 32" sub="+3 this week" icon={I.check} />
        <SCard label="Average Grade" value="88%" sub="↑ 3% from last module" icon={I.star} />
        <SCard label="Pending Labs" value={1} sub="Due today" icon={I.flask} />
      </div>

      {/* Main 2-col */}
      <div className="grid grid-cols-[1fr_300px] gap-6">
        {/* Active module */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-400">Continue learning</div>
              <h3 className="font-bold text-[#0D0118] text-lg mt-0.5">Module 3 — JavaScript</h3>
            </div>
            <button onClick={() => setPage('lesson')}
              className="flex items-center gap-2 px-4 py-2 bg-[#6D4AFF] text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
              <Ic d={I.play} s={13} />Resume
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {modules[2].lessonList.map((l, i) => {
              const isNext = !l.done && modules[2].lessonList.findIndex(x => !x.done) === i
              return (
                <div key={l.id} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors
                  ${isNext ? 'bg-violet-50 ring-1 ring-violet-100' : 'hover:bg-gray-50'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0
                    ${l.done ? 'bg-[#6D4AFF]' : isNext ? 'border-2 border-[#6D4AFF]' : 'border-2 border-gray-200'}`}>
                    {l.done
                      ? <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d={I.check} /></svg>
                      : isNext ? <div className="w-2 h-2 rounded-full bg-[#6D4AFF]" /> : null}
                  </div>
                  <span className={`text-sm flex-1 ${l.done ? 'text-gray-300 line-through' : isNext ? 'text-[#6D4AFF] font-semibold' : 'text-gray-500'}`}>{l.title}</span>
                  <Tag label={l.type} variant={l.type === 'quiz' ? 'info' : l.type === 'lab' ? 'gold' : l.type === 'exercise' ? 'default' : 'muted'} />
                </div>
              )
            })}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-400">Module completion</span>
              <span className="font-mono font-semibold text-[#6D4AFF]">2 of 6 lessons · 33%</span>
            </div>
            <Bar value={33} />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Upcoming */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-sm font-bold text-[#0D0118] mb-4">Upcoming deadlines</div>
            <div className="flex flex-col gap-3">
              {[
                { title: 'Day 3 Lab: Interactivity', date: 'Today', type: 'lab', urgent: true },
                { title: 'JavaScript Assessment', date: 'Sep 18', type: 'quiz', urgent: false },
                { title: 'Day 4 Lab: Form Validation', date: 'Sep 17', type: 'lab', urgent: false },
              ].map((u, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${u.urgent ? 'bg-amber-50 border border-amber-100' : 'border border-gray-100'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${u.urgent ? 'bg-amber-100' : 'bg-gray-100'}`}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={u.urgent ? '#92400E' : '#6B7280'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d={u.type === 'quiz' ? I.clipboard : I.flask} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold truncate ${u.urgent ? 'text-amber-900' : 'text-[#0D0118]'}`}>{u.title}</div>
                    <div className={`text-[11px] mt-0.5 ${u.urgent ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>{u.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent grades */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-sm font-bold text-[#0D0118] mb-4">Recent results</div>
            <div className="flex flex-col gap-3">
              {submissions.filter(s => s.status === 'graded').slice(0, 3).map(s => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[#0D0118] truncate">{s.activity}</div>
                    <div className="text-[11px] text-gray-400 font-mono">{s.submitted}</div>
                  </div>
                  <div className={`text-sm font-bold font-mono ml-3 px-2.5 py-0.5 rounded-lg
                    ${s.grade! >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{s.grade}%</div>
                </div>
              ))}
              <button className="text-xs text-[#6D4AFF] font-semibold mt-1 hover:underline" onClick={() => setPage('grades')}>
                View full transcript →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentCourses({ setPage, onOpenLesson }: { setPage: (p: StudentPage) => void; onOpenLesson: (moduleId: number, lessonId: number) => void }) {
  const [expanded, setExpanded] = useState<number | null>(3)
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0D0118] tracking-tight">Full-Stack Web Development</h2>
          <p className="text-sm text-gray-400 mt-1">9 modules, HTML through capstone.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-400">Overall Progress</div>
            <div className="text-lg font-bold text-[#6D4AFF] font-mono">22%</div>
          </div>
          <div className="w-24"><Bar value={22} /></div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {modules.map(mod => {
          const done = mod.lessonList.filter(l => l.done).length
          return (
            <div key={mod.id} className={`bg-white rounded-2xl border overflow-hidden transition-all
              ${mod.state === 'current' ? 'border-violet-200 shadow-sm shadow-violet-50' : mod.state === 'locked' ? 'border-gray-100 opacity-60' : 'border-gray-100'}`}>
              <div className="flex items-center gap-4 px-6 py-4">
                {/* State indicator */}
                {mod.state === 'completed' && (
                  <div className="w-9 h-9 rounded-full bg-[#6D4AFF] flex items-center justify-center shrink-0">
                    <Ic d={I.check} s={14} w={2.5} />
                  </div>
                )}
                {mod.state === 'current' && (
                  <div className="w-9 h-9 rounded-full border-2 border-[#6D4AFF] flex items-center justify-center shrink-0">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#6D4AFF]" />
                  </div>
                )}
                {mod.state === 'locked' && (
                  <div className="w-9 h-9 rounded-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 text-gray-300">
                    <Ic d={I.lock} s={14} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Module {String(mod.id).padStart(2, '0')}</span>
                    {mod.state === 'current' && <Tag label="Active" variant="primary" />}
                    {mod.state === 'completed' && <Tag label="Completed" variant="success" />}
                    {mod.state === 'locked' && <Tag label="Locked" variant="muted" />}
                  </div>
                  <div className={`font-semibold mt-0.5 ${mod.state === 'locked' ? 'text-gray-400' : 'text-[#0D0118]'}`}>{mod.title}</div>
                  {mod.state !== 'locked' && (
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{done} / {mod.lessonList.length} lessons complete</div>
                  )}
                  {mod.state === 'locked' && (
                    <div className="text-xs text-gray-400 mt-0.5">{mod.lessons} lessons · Complete prior module to unlock</div>
                  )}
                </div>
                {mod.state !== 'locked' && (
                  <button onClick={() => setExpanded(expanded === mod.id ? null : mod.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors
                      ${mod.state === 'current' ? 'bg-[#6D4AFF] text-white hover:bg-violet-700' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {expanded === mod.id ? 'Hide lessons' : 'View lessons'}
                    <span className={`transition-transform ${expanded === mod.id ? 'rotate-90' : ''}`}><Ic d={I.chevRight} s={13} /></span>
                  </button>
                )}
              </div>
              {mod.state === 'current' && (
                <div className="px-6 pb-4">
                  <Bar value={done} max={mod.lessonList.length} thin />
                </div>
              )}
              {expanded === mod.id && mod.lessonList.length > 0 && (
                <div className="border-t border-gray-100 flex flex-col">
                  {mod.lessonList.map(l => (
                    <button key={l.id} onClick={() => onOpenLesson(mod.id, l.id)}
                      className="flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${l.done ? 'bg-[#6D4AFF]' : 'border border-gray-200 text-gray-300'}`}>
                        {l.done ? <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d={I.check} /></svg> : <Ic d={l.type === 'video' ? I.play : I.book} s={11} />}
                      </div>
                      <span className={`text-sm flex-1 ${l.done ? 'text-gray-500' : 'text-[#0D0118] font-medium'}`}>{l.title}</span>
                      <Tag label={l.type} variant="muted" />
                      <Ic d={I.chevRight} s={13} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StudentLesson({ setPage, moduleId, lessonId, onOpenLesson }: { setPage: (p: StudentPage) => void; moduleId: number; lessonId: number; onOpenLesson: (moduleId: number, lessonId: number) => void }) {
  const mod = modules.find(m => m.id === moduleId) ?? modules[2]
  const lesson = mod.lessonList.find(l => l.id === lessonId) ?? mod.lessonList[0]
  // Only the JavaScript module's "DOM Manipulation" lesson has fully authored
  // exercise + lab content in this build — every other lesson shows the
  // generic view (or the video player) until real per-lesson content is
  // wired up from the backend/CMS.
  const isShowcase = mod.id === 3 && lesson.id === 3
  const isVideo = lesson.type === 'video' && !isShowcase

  type TabId = 'lesson' | 'exercise' | 'lab' | 'video' | 'generic'
  const [tab, setTab] = useState<TabId>(isVideo ? 'video' : 'lesson')
  useEffect(() => { setTab(isVideo ? 'video' : 'lesson') }, [moduleId, lessonId, isVideo])

  const [code, setCode] = useState(`// Exercise: DOM Manipulation
// Attach a click listener to the button so it changes
// the paragraph text to "Hello, World!"

const button = document.getElementById('myBtn');
const para   = document.getElementById('myPara');

// ↓ Write your solution below
`)
  const [output, setOutput] = useState<{ lines: string[]; error: boolean } | null>(null)

  function runCode() {
    const logs: string[] = []
    try {
      // eslint-disable-next-line no-new-func
      new Function('console', code)({ log: (...a: unknown[]) => logs.push(a.map(String).join(' ')) })
      setOutput({ lines: logs.length ? logs : ['// No console output'], error: false })
    } catch (e: unknown) {
      setOutput({ lines: [(e as Error).message], error: true })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Lesson header */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setPage('courses')} className="text-gray-400 hover:text-gray-600 transition-colors"><Ic d={I.chevRight} s={16} w={1.5} /></button>
          <div>
            <div className="text-[11px] font-semibold text-gray-400">Module {String(mod.id).padStart(2, '0')}, Lesson {String(lesson.id).padStart(2, '0')}</div>
            <h1 className="font-bold text-[#0D0118] text-base mt-0.5">{lesson.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isShowcase && (
            <button onClick={() => setPage('quiz')}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
              <Ic d={I.clipboard} s={13} />Take Assessment
            </button>
          )}
          {(() => {
            const idx = mod.lessonList.findIndex(l => l.id === lesson.id)
            const next = mod.lessonList[idx + 1]
            return next ? (
              <button onClick={() => onOpenLesson(mod.id, next.id)} className="flex items-center gap-1.5 px-3.5 py-2 bg-[#6D4AFF] text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
                Next Lesson <Ic d={I.chevRight} s={13} />
              </button>
            ) : null
          })()}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-white shrink-0 px-8">
        {(isVideo
          ? [{ id: 'video' as TabId, label: 'Video', icon: I.play }]
          : isShowcase
            ? [{ id: 'lesson' as TabId, label: 'Lesson Content', icon: I.book }, { id: 'exercise' as TabId, label: 'Code Exercise', icon: I.code }, { id: 'lab' as TabId, label: 'Day 3 Lab', icon: I.flask }]
            : [{ id: 'generic' as TabId, label: 'Lesson Content', icon: I.book }]
        ).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors -mb-px
              ${tab === t.id ? 'border-[#6D4AFF] text-[#6D4AFF]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <Ic d={t.icon} s={13} />{t.label}
            {t.id === 'lab' && <Tag label="Due Today" variant="gold" />}
          </button>
        ))}
      </div>

      {tab === 'video' && (
        <div className="flex gap-0 flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl">
              <VideoPlayer url={(lesson as { videoUrl?: string }).videoUrl} title={lesson.title} />
              <h2 className="text-xl font-bold text-[#0D0118] mt-6 mb-2">{lesson.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{(lesson as { duration?: string }).duration ? `${(lesson as { duration?: string }).duration} · ` : ''}Part of {mod.title}.</p>
            </div>
          </div>
          <div className="w-52 border-l border-gray-100 p-4 shrink-0">
            <div className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-3">Module Lessons</div>
            <div className="flex flex-col gap-1">
              {mod.lessonList.map(l => (
                <button key={l.id} onClick={() => onOpenLesson(mod.id, l.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-colors
                    ${l.id === lesson.id ? 'bg-violet-50 text-[#6D4AFF] font-semibold' : l.done ? 'text-gray-400 hover:bg-gray-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${l.done ? 'bg-[#6D4AFF]' : l.id === lesson.id ? 'border-2 border-[#6D4AFF]' : 'border border-gray-200'}`}>
                    {l.done && <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d={I.check} /></svg>}
                  </div>
                  {l.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'generic' && (
        <div className="flex gap-0 flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl">
              <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 mb-6">
                <div className="text-xs font-bold text-[#6D4AFF] mb-3">{lesson.type === 'exercise' ? 'Exercise' : lesson.type === 'lab' ? 'Lab' : lesson.type === 'quiz' ? 'Assessment' : 'Tutorial'}</div>
                <div className="text-sm text-violet-800">{lesson.title} — part of {mod.title}.</div>
              </div>
              <div className="border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
                Content for this lesson hasn't been authored yet. Once your backend serves lesson content (text, code samples, attachments), it renders here.
              </div>
            </div>
          </div>
          <div className="w-52 border-l border-gray-100 p-4 shrink-0">
            <div className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-3">Module Lessons</div>
            <div className="flex flex-col gap-1">
              {mod.lessonList.map(l => (
                <button key={l.id} onClick={() => onOpenLesson(mod.id, l.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-colors
                    ${l.id === lesson.id ? 'bg-violet-50 text-[#6D4AFF] font-semibold' : l.done ? 'text-gray-400 hover:bg-gray-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${l.done ? 'bg-[#6D4AFF]' : l.id === lesson.id ? 'border-2 border-[#6D4AFF]' : 'border border-gray-200'}`}>
                    {l.done && <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d={I.check} /></svg>}
                  </div>
                  {l.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'lesson' && (
        <div className="flex gap-0 flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl">
              <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 mb-6">
                <div className="text-xs font-bold text-[#6D4AFF] mb-3">Learning objectives</div>
                {['Understand what the DOM is and how browsers parse HTML', 'Select elements using getElementById and querySelector', 'Modify element content, attributes, and CSS classes', 'Respond to user events using addEventListener'].map(o => (
                  <div key={o} className="flex items-start gap-2 text-sm text-violet-800 mt-2">
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#6D4AFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d={I.check} /></svg>{o}
                  </div>
                ))}
              </div>
              <h2 className="text-xl font-bold text-[#0D0118] mb-3">What is the DOM?</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">The Document Object Model (DOM) is a tree-structured interface that browsers expose to JavaScript, representing every element, attribute, and text node in an HTML document. Manipulating this tree — adding, removing, or modifying nodes — is what makes web pages interactive.</p>
              <div className="bg-[#0D0118] rounded-2xl p-5 mb-6 font-mono text-sm overflow-x-auto">
                <div className="text-gray-500 text-xs mb-2">// Selecting elements</div>
                <div className="text-emerald-400">{'const el = document.getElementById(\'myId\');'}</div>
                <div className="text-emerald-400">{'const all = document.querySelectorAll(\'.card\');'}</div>
                <div className="text-gray-500 text-xs mt-3 mb-2">// Modifying content</div>
                <div className="text-violet-300">{'el.textContent = \'New text content\';'}</div>
                <div className="text-violet-300">{'el.classList.add(\'active\');'}</div>
                <div className="text-gray-500 text-xs mt-3 mb-2">// Events</div>
                <div className="text-amber-300">{"el.addEventListener('click', () => { console.log('clicked'); });"}</div>
              </div>
              <h2 className="text-xl font-bold text-[#0D0118] mb-3">Event-Driven Programming</h2>
              <p className="text-gray-600 text-sm leading-relaxed">JavaScript in the browser is fundamentally event-driven. Rather than running top-to-bottom once, your code registers handlers that fire in response to user interactions — clicks, key presses, form submissions, and more.</p>
            </div>
          </div>
          <div className="w-52 border-l border-gray-100 p-4 shrink-0">
            <div className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-3">Module Lessons</div>
            <div className="flex flex-col gap-1">
              {mod.lessonList.map(l => (
                <button key={l.id} onClick={() => onOpenLesson(mod.id, l.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-colors
                    ${l.id === lesson.id ? 'bg-violet-50 text-[#6D4AFF] font-semibold' : l.done ? 'text-gray-300 hover:bg-gray-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0
                    ${l.done ? 'bg-[#6D4AFF]' : l.id === lesson.id ? 'border-2 border-[#6D4AFF]' : 'border border-gray-200'}`}>
                    {l.done && <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d={I.check} /></svg>}
                  </div>
                  <span className={l.done && l.id !== lesson.id ? 'line-through' : ''}>{l.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'exercise' && (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col bg-[#0A0F1A]">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#111827] border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/60" /><div className="w-3 h-3 rounded-full bg-amber-500/60" /><div className="w-3 h-3 rounded-full bg-emerald-500/60" /></div>
                <span className="text-gray-500 text-xs font-mono ml-1">exercise.js</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCode(`// Exercise: DOM Manipulation\nconst button = document.getElementById('myBtn');\nconst para   = document.getElementById('myPara');\n\n// ↓ Write your solution below\n`)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs hover:bg-white/10 transition-colors">
                  <Ic d={I.refresh} s={11} />Reset
                </button>
                <button onClick={runCode}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#6D4AFF] text-white text-xs font-bold hover:bg-violet-600 transition-colors">
                  <Ic d={I.play} s={11} />Run Code
                </button>
              </div>
            </div>
            <div className="bg-[#0D1117] border-b border-white/5 px-4 py-2.5">
              <span className="text-amber-400 text-xs font-mono">// </span>
              <span className="text-gray-400 text-xs font-mono">Add a click listener to the button so it changes the paragraph text to "Hello, World!"</span>
            </div>
            <textarea value={code} onChange={e => setCode(e.target.value)}
              className="flex-1 bg-[#0D1117] text-emerald-300 font-mono text-sm p-5 outline-none resize-none leading-relaxed"
              spellCheck={false} />
            <div className="bg-[#060A0F] border-t border-white/5 px-4 py-3 min-h-20">
              <div className="flex items-center gap-2 mb-2 text-gray-600">
                <Ic d={I.terminal} s={12} />
                <span className="text-xs font-semibold">Console Output</span>
              </div>
              {output
                ? <div className={`font-mono text-xs leading-relaxed ${output.error ? 'text-red-400' : 'text-emerald-400'}`}>{output.lines.map((l, i) => <div key={i}>{l}</div>)}</div>
                : <div className="text-gray-700 text-xs font-mono">Press Run Code to execute…</div>}
            </div>
          </div>
          <div className="w-72 bg-white border-l border-gray-100 p-5 shrink-0 flex flex-col gap-5">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-3">Test Cases</div>
              {[{ label: 'Button element exists in DOM', pass: true }, { label: 'Paragraph element exists in DOM', pass: true }, { label: 'Click listener is attached', pass: false }, { label: 'Text changes to "Hello, World!"', pass: false }].map((t, i) => (
                <div key={i} className={`flex items-center gap-2.5 py-2.5 border-b border-gray-50 last:border-0`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${t.pass ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                    <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={t.pass ? '#059669' : '#9CA3AF'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d={t.pass ? I.check : I.x} /></svg>
                  </div>
                  <span className={`text-xs font-mono ${t.pass ? 'text-emerald-700' : 'text-gray-400'}`}>{t.label}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs mb-2"><span className="text-gray-400">Tests passed</span><span className="font-mono text-[#6D4AFF] font-bold">2 / 4</span></div>
              <Bar value={2} max={4} />
              <div className="mt-3 flex justify-between text-xs"><span className="text-gray-400">Score</span><span className="font-mono font-bold text-[#6D4AFF]">0 / 20 pts</span></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'lab' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <Tag label="Day 3 Lab" variant="gold" />
                <h2 className="text-2xl font-bold text-[#0D0118] mt-2 tracking-tight">Add Interactivity to Your Profile Page</h2>
                <div className="flex items-center gap-5 mt-2 text-xs text-gray-400 font-mono">
                  <span className="flex items-center gap-1.5"><Ic d={I.clock} s={12} />Due: Sep 16, 2025</span>
                  <span className="flex items-center gap-1.5"><Ic d={I.clipboard} s={12} />Attempts: 0 / 1</span>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6">
              <div className="text-xs font-bold text-amber-700 mb-3">Lab requirements</div>
              {['Add a functional dark/light mode toggle', 'Implement a contact form with client-side validation', 'Display a success message on valid form submission', 'Add a dynamic skills filter with smooth transitions'].map(t => (
                <div key={t} className="flex items-start gap-2 text-sm text-amber-900 mt-2">
                  <Ic d={I.chevRight} s={12} />{t}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">GitHub repository URL *</label>
                <input placeholder="https://github.com/username/profile-page" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6D4AFF] transition-colors font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Live preview URL</label>
                <input placeholder="https://username.github.io/profile-page" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6D4AFF] transition-colors font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Submission notes</label>
                <textarea rows={4} placeholder="Describe your implementation and any challenges encountered…" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6D4AFF] transition-colors resize-none" />
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-[#6D4AFF] transition-colors cursor-pointer">
                <Ic d={I.upload} s={22} />
                <div className="text-sm text-gray-500">Upload project files <span className="text-[#6D4AFF] font-semibold">or drag & drop</span></div>
                <div className="text-xs text-gray-400 font-mono">ZIP, HTML, CSS, JS · max 50 MB</div>
              </div>
              <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#6D4AFF] text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors">
                <Ic d={I.send} s={14} />Submit Lab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StudentQuiz({ setPage }: { setPage: (p: StudentPage) => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const score = () => quizQuestions.filter(q => answers[q.id] === q.correct).length
  const pct = Math.round((score() / quizQuestions.length) * 100)
  const passed = pct >= 70

  if (submitted) return (
    <div className="flex-1 overflow-y-auto p-8 max-w-xl mx-auto">
      <div className={`rounded-2xl p-8 text-center mb-6 ${passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-100'}`}>
        <div className={`text-6xl font-bold font-mono mb-2 ${passed ? 'text-emerald-600' : 'text-red-500'}`}>{pct}%</div>
        <div className={`text-lg font-bold ${passed ? 'text-emerald-700' : 'text-red-600'}`}>{passed ? 'Assessment Passed' : 'Assessment Not Passed'}</div>
        <div className="text-sm text-gray-500 font-mono mt-1">{score()} / {quizQuestions.length} correct · Pass mark: 70% · Attempt 1 of 2</div>
      </div>
      {quizQuestions.map((q, i) => {
        const ua = answers[q.id]; const ok = ua === q.correct
        return (
          <div key={q.id} className={`rounded-2xl border p-5 mb-3 ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-100 bg-red-50'}`}>
            <div className="flex items-start gap-3 mb-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white ${ok ? 'bg-emerald-500' : 'bg-red-400'}`}>
                <Ic d={ok ? I.check : I.x} s={9} w={2.5} />
              </div>
              <span className="text-sm font-semibold text-[#0D0118]">Q{i + 1}. {q.question}</span>
            </div>
            <div className="ml-8 text-xs font-mono">
              <span className="text-gray-500">Your answer: </span><span className={ok ? 'text-emerald-600' : 'text-red-500'}>{ua !== undefined ? q.options[ua] : '—'}</span>
              {!ok && <><br /><span className="text-gray-500">Correct: </span><span className="text-emerald-600">{q.options[q.correct]}</span></>}
            </div>
          </div>
        )
      })}
      <div className="flex gap-3 mt-4">
        <button onClick={() => setPage('courses')} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Back to Course</button>
        {!passed && <button onClick={() => setSubmitted(false)} className="px-5 py-2.5 bg-[#6D4AFF] text-white rounded-xl text-sm font-semibold hover:bg-violet-700">Retake Assessment</button>}
      </div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs font-semibold text-gray-400">Module 03 Assessment</div>
          <h2 className="text-xl font-bold text-[#0D0118] mt-0.5 tracking-tight">JavaScript Fundamentals</h2>
          <div className="text-xs text-gray-400 font-mono mt-0.5">4 questions · 70% to pass · 2 attempts allowed</div>
        </div>
        <div className="px-4 py-2 rounded-xl bg-violet-50 border border-violet-100 font-mono text-[#6D4AFF] font-bold text-sm flex items-center gap-2">
          <Ic d={I.clock} s={14} />14:52
        </div>
      </div>
      <div className="mb-5"><Bar value={Object.keys(answers).length} max={quizQuestions.length} /></div>
      <div className="flex flex-col gap-4">
        {quizQuestions.map((q, i) => (
          <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start gap-3 mb-5">
              <span className="w-7 h-7 rounded-full bg-violet-50 text-[#6D4AFF] flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
              <span className="text-sm font-semibold text-[#0D0118] leading-snug">{q.question}</span>
            </div>
            <div className="flex flex-col gap-2 ml-10">
              {q.options.map((opt, j) => (
                <button key={j} onClick={() => setAnswers(a => ({ ...a, [q.id]: j }))}
                  className={`text-left px-4 py-3 rounded-xl border text-sm transition-all
                    ${answers[q.id] === j ? 'border-[#6D4AFF] bg-violet-50 text-[#6D4AFF] font-semibold' : 'border-gray-200 hover:border-violet-200 text-gray-600 hover:bg-gray-50'}`}>
                  <span className="font-mono text-xs mr-2 text-gray-400">{['A', 'B', 'C', 'D'][j]}.</span>{opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-mono">{Object.keys(answers).length} of {quizQuestions.length} answered</span>
        <button onClick={() => setSubmitted(true)} className="flex items-center gap-2 px-6 py-2.5 bg-[#6D4AFF] text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors">
          <Ic d={I.send} s={14} />Submit Assessment
        </button>
      </div>
    </div>
  )
}

function StudentLabs() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h2 className="text-2xl font-bold text-[#0D0118] tracking-tight">Daily Labs</h2>
        <p className="text-sm text-gray-400 mt-1">Practical coding activities, graded by your instructor.</p>
      </div>
      <div className="flex flex-col gap-4">
        {dailyLabs.map(lab => (
          <div key={lab.id} className={`bg-white rounded-2xl border p-6 ${lab.status === 'pending' ? 'border-amber-200' : 'border-gray-100'}`}>
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                  ${lab.status === 'submitted' ? 'bg-emerald-100 text-emerald-600' : lab.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Ic d={I.flask} s={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-gray-400">{lab.day}</span>
                    <Tag label={lab.tech} variant="default" />
                    {lab.status === 'submitted' && <Tag label="Graded" variant="success" />}
                    {lab.status === 'pending' && <Tag label="Due Today" variant="gold" />}
                    {lab.status === 'upcoming' && <Tag label="Upcoming" variant="muted" />}
                  </div>
                  <h3 className="font-bold text-[#0D0118] mt-1.5 text-base">{lab.title}</h3>
                  <div className="text-xs text-gray-400 font-mono mt-1 flex items-center gap-1"><Ic d={I.clock} s={11} />Deadline: {lab.deadline}</div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                {lab.grade !== null && <div className={`text-3xl font-bold font-mono ${lab.grade >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{lab.grade}%</div>}
                {lab.status === 'pending' && <button className="flex items-center gap-2 px-4 py-2 bg-[#6D4AFF] text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"><Ic d={I.upload} s={13} />Submit</button>}
              </div>
            </div>
            {lab.feedback && (
              <div className="mt-4 px-5 py-3.5 bg-gray-50 rounded-xl border-l-4 border-[#6D4AFF]">
                <div className="text-xs font-semibold text-gray-500 mb-1">Instructor feedback</div>
                <div className="text-sm text-gray-600 italic">"{lab.feedback}"</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StudentSubmissions() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div><h2 className="text-2xl font-bold text-[#0D0118] tracking-tight">Submission History</h2><p className="text-sm text-gray-400 mt-1">Everything you've submitted, graded or not.</p></div>
      <div className="flex flex-col gap-4">
        {submissions.map(s => (
          <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.type === 'quiz' ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'}`}>
                  <Ic d={s.type === 'quiz' ? I.clipboard : I.flask} s={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag label={s.type === 'quiz' ? 'Assessment' : 'Lab'} variant={s.type === 'quiz' ? 'info' : 'gold'} />
                    <Tag label={s.status === 'graded' ? 'Graded' : 'Pending Review'} variant={s.status === 'graded' ? 'success' : 'muted'} />
                  </div>
                  <h3 className="font-semibold text-[#0D0118] mt-1.5 text-sm">{s.activity}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 font-mono">
                    <span>Submitted: {s.submitted}</span>
                    <span>Attempts: {s.attempts}</span>
                  </div>
                </div>
              </div>
              {s.grade !== null && (
                <div className={`text-2xl font-bold font-mono px-3 py-1 rounded-xl ${s.grade >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{s.grade}%</div>
              )}
            </div>
            {s.feedback && (
              <div className="mt-3 px-4 py-3 bg-gray-50 rounded-xl border-l-4 border-[#6D4AFF]">
                <div className="text-xs font-semibold text-gray-500 mb-1">Feedback</div>
                <div className="text-sm text-gray-600">"{s.feedback}"</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StudentGrades() {
  const graded = submissions.filter(s => s.grade !== null)
  const avg = Math.round(graded.reduce((a, s) => a + s.grade!, 0) / graded.length)
  return (
    <div className="flex flex-col gap-6 p-8">
      <div><h2 className="text-2xl font-bold text-[#0D0118] tracking-tight">Grades &amp; Transcript</h2><p className="text-sm text-gray-400 mt-1">Your academic record for this cohort.</p></div>
      <div className="grid grid-cols-4 gap-4">
        {[{ l: 'Overall Average', v: `${avg}%`, icon: I.star }, { l: 'Graded Items', v: graded.length, icon: I.check }, { l: 'Pending Review', v: submissions.filter(s => s.status === 'pending').length, icon: I.clock }, { l: 'Top Score', v: '92%', icon: I.award }].map(c => (
          <div key={c.l} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{c.l}</div>
            <div className="text-3xl font-bold text-[#0D0118] mt-2">{c.v}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-4 px-6 py-3.5 bg-gray-50 border-b border-gray-100 text-[11px] font-mono text-gray-400 uppercase tracking-wider">
          <span>Activity</span><span>Type</span><span>Attempts</span><span>Grade</span><span>Feedback</span>
        </div>
        {submissions.map(s => (
          <div key={s.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-4 px-6 py-4 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium text-[#0D0118]">{s.activity}</span>
            <Tag label={s.type === 'quiz' ? 'Assessment' : 'Lab'} variant={s.type === 'quiz' ? 'info' : 'gold'} />
            <span className="text-xs font-mono text-gray-500">{s.attempts}</span>
            <span className={`text-sm font-bold font-mono ${s.grade !== null ? (s.grade >= 80 ? 'text-emerald-600' : 'text-amber-600') : 'text-gray-300'}`}>{s.grade !== null ? `${s.grade}%` : '—'}</span>
            <span className="text-xs text-gray-500 italic">{s.feedback ? `"${s.feedback}"` : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StudentPortal({ user, onExit }: { user: CurrentUser; onExit: () => void }) {
  const [page, setPage] = useState<StudentPage>('home')
  const [activeLesson, setActiveLesson] = useState<{ moduleId: number; lessonId: number }>({ moduleId: 3, lessonId: 3 })
  const activeMod = modules.find(m => m.id === activeLesson.moduleId)
  const activeL = activeMod?.lessonList.find(l => l.id === activeLesson.lessonId)

  function openLesson(moduleId: number, lessonId: number) {
    setActiveLesson({ moduleId, lessonId })
    setPage('lesson')
  }

  const titles: Record<StudentPage, { t: string; s?: string }> = {
    home: { t: 'Dashboard', s: 'Full-Stack Web Development · Cohort 2025' },
    courses: { t: 'My Courses', s: 'Full-Stack Web Development — 9 modules' },
    lesson: { t: activeL?.title || 'Lesson', s: activeMod ? `Module ${String(activeMod.id).padStart(2, '0')} · Lesson ${String(activeLesson.lessonId).padStart(2, '0')}` : undefined },
    quiz: { t: 'JavaScript Assessment', s: 'Module 03 · 4 questions' },
    labs: { t: 'Daily Labs', s: 'Practical coding activities' },
    submissions: { t: 'Submission History', s: 'All submitted work' },
    grades: { t: 'Grades & Transcript', s: 'Academic record' },
  }
  return (
    <div className="flex h-screen overflow-hidden">
      <StudentSidebar page={page} setPage={setPage} onExit={onExit} user={user} />
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FC]">
        {page !== 'lesson' && page !== 'quiz' && <StudentTopBar title={titles[page].t} sub={titles[page].s} user={user} />}
        <div className={`flex-1 overflow-y-auto ${page === 'lesson' || page === 'quiz' ? 'flex flex-col' : ''}`}>
          {page === 'home' && <StudentDashboard setPage={setPage} user={user} />}
          {page === 'courses' && <StudentCourses setPage={setPage} onOpenLesson={openLesson} />}
          {page === 'lesson' && <StudentLesson setPage={setPage} moduleId={activeLesson.moduleId} lessonId={activeLesson.lessonId} onOpenLesson={openLesson} />}
          {page === 'quiz' && <StudentQuiz setPage={setPage} />}
          {page === 'labs' && <StudentLabs />}
          {page === 'submissions' && <StudentSubmissions />}
          {page === 'grades' && <StudentGrades />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTRUCTOR PORTAL
// ═══════════════════════════════════════════════════════════════════════════════

const INST_NAV = [
  { id: 'home' as InstructorPage, label: 'Overview', icon: I.grid },
  { id: 'courses' as InstructorPage, label: 'Courses', icon: I.layers },
  { id: 'submissions' as InstructorPage, label: 'Submissions', icon: I.clipboard },
  { id: 'students' as InstructorPage, label: 'Students', icon: I.users },
  { id: 'analytics' as InstructorPage, label: 'Analytics', icon: I.chart },
]

function InstructorSidebar({ page, setPage, onExit, user }: { page: InstructorPage; setPage: (p: InstructorPage) => void; onExit: () => void; user: CurrentUser }) {
  return (
    <aside className="w-[228px] shrink-0 bg-[#021A15] flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center">
            <Ic d={I.layers} s={15} w={1.5} />
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-tight leading-none">Optimum <span className="text-[#34D399]">LMS</span></div>
            <div className="text-[11px] text-white/30 mt-0.5">Instructor</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {INST_NAV.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${page === item.id ? 'bg-[#0F766E] text-white shadow-lg shadow-teal-900/30' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
            <Ic d={item.icon} s={15} />{item.label}
          </button>
        ))}
      </nav>
      <div className="mx-3 mb-3 bg-white/5 rounded-xl p-4">
        <div className="text-[11px] text-white/30 font-semibold mb-2">Pending review</div>
        <div className="text-white font-bold text-2xl font-mono">{pendingSubs.length}</div>
        <div className="text-white/40 text-xs mt-0.5">submissions to grade</div>
      </div>
      <div className="px-4 pb-5 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3">
          <Av name={user.name} size={8} dark />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user.name}</div>
            <div className="text-xs text-white/30">{user.email}</div>
          </div>
          <button onClick={onExit} className="text-white/20 hover:text-white/50"><Ic d={I.logout} s={14} /></button>
        </div>
      </div>
    </aside>
  )
}

function ITopBar({ title, sub, action, user }: { title: string; sub?: string; action?: React.ReactNode; user: CurrentUser }) {
  return (
    <div className="h-16 border-b border-gray-100 px-8 flex items-center justify-between shrink-0 bg-white">
      <div>
        <h1 className="font-bold text-[#021A15] text-lg tracking-tight">{title}</h1>
        {sub && <p className="text-gray-400 text-xs mt-0.5">{sub}</p>}
      </div>
      <div className="flex items-center gap-3">
        {action}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><Ic d={I.bell} s={17} /><span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#0F766E]" /></button>
        <div className="flex items-center gap-2.5"><Av name={user.name} size={8} /><span className="text-sm font-semibold text-[#021A15]">{user.name}</span></div>
      </div>
    </div>
  )
}

function ICard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center"><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg></div>
      </div>
      <div>
        <div className="text-2xl font-bold text-[#021A15]">{value}</div>
        {sub && <div className="text-xs font-mono text-emerald-600 mt-1">{sub}</div>}
      </div>
    </div>
  )
}

function InstructorHome({ setPage }: { setPage: (p: InstructorPage) => void }) {
  const atRisk = instStudents.filter(s => s.risk)
  return (
    <div className="flex flex-col gap-7 p-8">
      <div><h2 className="text-3xl font-bold text-[#021A15] tracking-tight">Good morning, Dr. Kim.</h2><p className="text-gray-400 mt-1.5">Full-Stack Web Development — {instStudents.length} students enrolled this term.</p></div>
      <div className="grid grid-cols-4 gap-4">
        <ICard label="Enrolled Students" value={instStudents.length} sub="+2 this week" icon={I.users} />
        <ICard label="Pending Reviews" value={pendingSubs.length} sub="Requires attention" icon={I.clipboard} />
        <ICard label="Cohort Avg. Grade" value="82%" sub="↑ 3% from last module" icon={I.star} />
        <ICard label="Students At Risk" value={atRisk.length} sub="Require intervention" icon={I.alert} />
      </div>
      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Pending submissions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#021A15] text-base">Pending Submissions</h3>
            <button onClick={() => setPage('submissions')} className="text-xs text-[#0F766E] font-semibold hover:underline">View all →</button>
          </div>
          <div className="flex flex-col gap-3">
            {pendingSubs.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                <Av name={s.student} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#021A15]">{s.student}</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">{s.activity} · {s.submitted}</div>
                  {s.github && <div className="text-xs text-[#0F766E] flex items-center gap-1 mt-0.5"><Ic d={I.git} s={11} />{s.github}</div>}
                </div>
                <Tag label={s.type === 'quiz' ? 'Assessment' : 'Lab'} variant={s.type === 'quiz' ? 'info' : 'gold'} />
                <button onClick={() => setPage('submissions')} className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F766E] text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors"><Ic d={I.edit} s={12} />Grade</button>
              </div>
            ))}
          </div>
        </div>

        {/* At-risk panel */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#021A15] text-base">Students Falling Behind</h3>
            <Tag label={`${atRisk.length} at risk`} variant="danger" />
          </div>
          <div className="bg-white rounded-2xl border border-red-100 p-4 flex flex-col gap-4">
            {atRisk.map(s => (
              <div key={s.name} className="flex items-center gap-3">
                <Av name={s.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#021A15]">{s.name}</div>
                  <div className="text-xs text-gray-400 font-mono">Last seen: {s.lastActive}</div>
                  <div className="mt-1.5"><Bar value={s.progress} thin /></div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold font-mono text-red-500">{s.progress}%</div>
                  <Tag label="At risk" variant="danger" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function InstructorCourses() {
  const [open, setOpen] = useState<number | null>(3)
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-[#021A15] tracking-tight">Full-Stack Web Development</h2><p className="text-sm text-gray-400 mt-1">Curriculum for this cohort — 9 modules.</p></div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50"><Ic d={I.plus} s={13} />Add Module</button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] text-white rounded-xl text-sm font-bold hover:bg-teal-700"><Ic d={I.plus} s={13} />Add Lesson</button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {modules.map(mod => (
          <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors" onClick={() => setOpen(open === mod.id ? null : mod.id)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                ${mod.state === 'completed' ? 'bg-[#0F766E] text-white' : mod.state === 'current' ? 'border-2 border-[#0F766E] text-[#0F766E]' : 'bg-gray-100 text-gray-400'}`}>
                {mod.state === 'completed' ? <Ic d={I.check} s={12} w={2.5} /> : mod.id}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-[#021A15] text-sm">{mod.title}</div>
                <div className="text-xs text-gray-400 font-mono">{mod.lessons} lessons</div>
              </div>
              <Tag label={mod.state} variant={mod.state === 'completed' ? 'success' : mod.state === 'current' ? 'primary' : 'muted'} />
              <Ic d={open === mod.id ? I.chevDown : I.chevRight} s={14} />
            </button>
            {open === mod.id && mod.lessonList.length > 0 && (
              <div className="border-t border-gray-100 px-6 pb-4">
                {mod.lessonList.map(l => (
                  <div key={l.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${l.done ? 'bg-[#0F766E]' : 'bg-gray-200'}`} />
                    <span className="text-sm text-[#021A15] flex-1">{l.title}</span>
                    <Tag label={l.type} variant={l.type === 'quiz' ? 'info' : l.type === 'lab' ? 'gold' : l.type === 'exercise' ? 'default' : 'muted'} />
                    <button className="p-1.5 text-gray-300 hover:text-[#0F766E] transition-colors"><Ic d={I.edit} s={13} /></button>
                    <button className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"><Ic d={I.trash} s={13} /></button>
                  </div>
                ))}
                <button className="flex items-center gap-1.5 text-xs text-[#0F766E] font-semibold mt-3 hover:underline"><Ic d={I.plus} s={12} />Add lesson</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function InstructorSubmissions() {
  const [selected, setSelected] = useState<typeof pendingSubs[0] | null>(null)
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')
  return (
    <div className="flex flex-1 gap-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-2xl font-bold text-[#021A15] tracking-tight">Submissions</h2><p className="text-sm text-gray-400 mt-1">Review and grade student work.</p></div>
          <Tag label={`${pendingSubs.length} pending`} variant="warning" />
        </div>
        <div className="flex flex-col gap-3">
          {pendingSubs.map((s, i) => (
            <button key={i} onClick={() => { setSelected(s); setGrade(''); setFeedback('') }}
              className={`w-full text-left bg-white border rounded-2xl p-5 flex items-center gap-4 transition-all
                ${selected === s ? 'border-[#0F766E] shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
              <Av name={s.student} size={10} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#021A15]">{s.student}</div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">{s.activity} · {s.submitted} · Attempts: {s.attempts}</div>
                {s.github && <div className="text-xs text-[#0F766E] flex items-center gap-1.5 mt-1"><Ic d={I.git} s={11} />{s.github}</div>}
              </div>
              <Tag label="Awaiting Grade" variant="warning" />
            </button>
          ))}
        </div>
      </div>
      {selected && (
        <div className="w-80 border-l border-gray-100 bg-white p-6 flex flex-col gap-5 shrink-0">
          <div>
            <div className="text-xs font-semibold text-gray-400 mb-1">Grading</div>
            <div className="font-bold text-[#021A15] text-base">{selected.student}</div>
            <div className="text-xs text-gray-400 mt-0.5">{selected.activity}</div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5">Score (0–100)</label>
            <input type="number" min={0} max={100} value={grade} onChange={e => setGrade(e.target.value)} placeholder="e.g. 87"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0F766E] transition-colors font-mono text-lg font-bold" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5">Instructor feedback</label>
            <textarea rows={6} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Provide constructive, specific feedback…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0F766E] transition-colors resize-none" />
          </div>
          <div className="flex flex-col gap-2">
            <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0F766E] text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors">
              <Ic d={I.send} s={14} />Submit Grade
            </button>
            <button onClick={() => setSelected(null)} className="px-5 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function InstructorStudents() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-[#021A15] tracking-tight">Students</h2><p className="text-sm text-gray-400 mt-1">Monitor your cohort's progress.</p></div>
        <div className="flex gap-2"><Tag label={`${instStudents.filter(s => s.risk).length} at risk`} variant="danger" /><Tag label={`${instStudents.length} enrolled`} variant="primary" /></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3.5 bg-gray-50 border-b border-gray-100 text-[11px] font-mono text-gray-400 uppercase tracking-wider">
          <span>Student</span><span>Email</span><span>Progress</span><span>Last Active</span><span>Lab</span><span>Status</span>
        </div>
        {instStudents.map(s => (
          <div key={s.name} className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0 ${s.risk ? 'bg-red-50/30' : ''}`}>
            <div className="flex items-center gap-3"><Av name={s.name} size={8} /><span className="text-sm font-semibold text-[#021A15]">{s.name}</span></div>
            <span className="text-xs text-gray-400 font-mono truncate">{s.email}</span>
            <div className="flex items-center gap-2"><div className="w-16"><Bar value={s.progress} thin /></div><span className="text-xs font-mono text-[#0F766E] font-bold">{s.progress}%</span></div>
            <span className="text-xs text-gray-400 font-mono">{s.lastActive}</span>
            <Tag label={s.lab === 'submitted' ? 'Submitted' : s.lab === 'pending' ? 'Pending' : 'Missing'} variant={s.lab === 'submitted' ? 'success' : s.lab === 'pending' ? 'warning' : 'danger'} />
            <Tag label={s.risk ? 'At risk' : 'On track'} variant={s.risk ? 'danger' : 'success'} />
          </div>
        ))}
      </div>
    </div>
  )
}

function InstructorAnalytics() {
  const weeks = ['W33', 'W34', 'W35', 'W36', 'W37', 'W38']
  const vals = [4, 7, 6, 9, 8, 11]; const mx = Math.max(...vals)
  return (
    <div className="flex flex-col gap-6 p-8">
      <div><h2 className="text-2xl font-bold text-[#021A15] tracking-tight">Analytics</h2><p className="text-sm text-gray-400 mt-1">Course performance for this cohort.</p></div>
      <div className="grid grid-cols-4 gap-4">
        <ICard label="Completion Rate" value="71%" sub="+3% this month" icon={I.trending} />
        <ICard label="Avg Quiz Score" value="82%" icon={I.star} />
        <ICard label="Lab Submission Rate" value="88%" icon={I.flask} />
        <ICard label="On-track Students" value="18 / 24" icon={I.users} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-[#021A15] mb-6">Weekly Lesson Completions</h3>
          <div className="flex items-end gap-3 h-36">
            {weeks.map((w, i) => (
              <div key={w} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-xl bg-teal-50 hover:bg-[#0F766E] transition-colors group relative" style={{ height: `${(vals[i] / mx) * 120}px` }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-xs font-mono text-[#0F766E]">{vals[i]}</div>
                </div>
                <span className="text-xs text-gray-400 font-mono">{w}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-[#021A15] mb-4">Grade Distribution</h3>
          {[['90–100%', 6, 24], ['80–89%', 9, 24], ['70–79%', 5, 24], ['Below 70%', 4, 24]].map(([r, c, t]) => (
            <div key={r as string} className="mb-4 last:mb-0">
              <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-500">{r}</span><span className="font-mono font-bold text-[#0F766E]">{c} students</span></div>
              <Bar value={c as number} max={t as number} thin />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InstructorPortal({ user, onExit }: { user: CurrentUser; onExit: () => void }) {
  const [page, setPage] = useState<InstructorPage>('home')
  const titles: Record<InstructorPage, string> = { home: 'Overview', courses: 'Courses', submissions: 'Submissions', students: 'Students', analytics: 'Analytics' }
  const subs: Record<InstructorPage, string> = { home: 'Full-Stack Web Development · Cohort 2025', courses: 'Curriculum management', submissions: 'Review & grade student work', students: 'Monitor cohort progress', analytics: 'Course performance insights' }
  return (
    <div className="flex h-screen overflow-hidden">
      <InstructorSidebar page={page} setPage={setPage} onExit={onExit} user={user} />
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAF9]">
        {page !== 'submissions' && <ITopBar title={titles[page]} sub={subs[page]} user={user} />}
        {page === 'submissions' && <ITopBar title="Submissions" sub="Review and grade student work" user={user} />}
        <div className={`flex-1 overflow-y-auto ${page === 'submissions' ? 'flex overflow-hidden' : ''}`}>
          {page === 'home' && <InstructorHome setPage={setPage} />}
          {page === 'courses' && <InstructorCourses />}
          {page === 'submissions' && <InstructorSubmissions />}
          {page === 'students' && <InstructorStudents />}
          {page === 'analytics' && <InstructorAnalytics />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN PORTAL
// ═══════════════════════════════════════════════════════════════════════════════

const ADMIN_NAV = [
  { id: 'home' as AdminPage, label: 'Overview', icon: I.grid },
  { id: 'users' as AdminPage, label: 'Users', icon: I.users },
  { id: 'courses' as AdminPage, label: 'Courses', icon: I.book },
  { id: 'analytics' as AdminPage, label: 'Analytics', icon: I.chart },
  { id: 'settings' as AdminPage, label: 'Settings', icon: I.settings },
]

function AdminSidebar({ page, setPage, onExit, user }: { page: AdminPage; setPage: (p: AdminPage) => void; onExit: () => void; user: CurrentUser }) {
  return (
    <aside className="w-[228px] shrink-0 bg-[#060B18] flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1D4ED8] flex items-center justify-center"><Ic d={I.shield} s={15} w={1.5} /></div>
          <div>
            <div className="text-white font-bold text-sm tracking-tight leading-none">Optimum <span className="text-[#60A5FA]">LMS</span></div>
            <div className="text-[11px] text-white/30 mt-0.5">Administrator</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {ADMIN_NAV.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${page === item.id ? 'bg-[#1D4ED8] text-white shadow-lg shadow-blue-900/30' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
            <Ic d={item.icon} s={15} />{item.label}
          </button>
        ))}
      </nav>
      <div className="mx-3 mb-3 bg-white/5 rounded-xl p-4 flex flex-col gap-2">
        {[{ label: 'Students', value: 18 }, { label: 'Instructors', value: 3 }, { label: 'Courses', value: 4 }].map(m => (
          <div key={m.label} className="flex items-center justify-between">
            <span className="text-white/30 text-xs">{m.label}</span>
            <span className="text-white font-bold font-mono text-sm">{m.value}</span>
          </div>
        ))}
      </div>
      <div className="px-4 pb-5 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3">
          <Av name={user.name} size={8} dark />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user.name}</div>
            <div className="text-xs text-white/30">{user.email}</div>
          </div>
          <button onClick={onExit} className="text-white/20 hover:text-white/50"><Ic d={I.logout} s={14} /></button>
        </div>
      </div>
    </aside>
  )
}

function ATopBar({ title, sub, action, user }: { title: string; sub?: string; action?: React.ReactNode; user: CurrentUser }) {
  return (
    <div className="h-16 border-b border-gray-100 px-8 flex items-center justify-between shrink-0 bg-white">
      <div><h1 className="font-bold text-[#060B18] text-lg tracking-tight">{title}</h1>{sub && <p className="text-gray-400 text-xs mt-0.5">{sub}</p>}</div>
      <div className="flex items-center gap-3">
        {action}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><Ic d={I.bell} s={17} /><span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" /></button>
        <div className="flex items-center gap-2.5"><Av name={user.name} size={8} /><span className="text-sm font-semibold text-[#060B18]">{user.name}</span></div>
      </div>
    </div>
  )
}

function ACard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center"><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg></div>
      </div>
      <div><div className="text-2xl font-bold text-[#060B18]">{value}</div>{sub && <div className="text-xs font-mono text-blue-600 mt-1">{sub}</div>}</div>
    </div>
  )
}

function AdminHome() {
  return (
    <div className="flex flex-col gap-7 p-8">
      <div><h2 className="text-3xl font-bold text-[#060B18] tracking-tight">Platform Overview</h2><p className="text-gray-400 mt-1.5">All systems operational.</p></div>
      <div className="grid grid-cols-4 gap-4">
        <ACard label="Total Students" value={18} sub="+3 this week" icon={I.users} />
        <ACard label="Active Instructors" value={3} icon={I.mortarboard} />
        <ACard label="Live Courses" value={4} icon={I.book} />
        <ACard label="Pending Submissions" value={pendingSubs.length} sub="Awaiting grading" icon={I.clipboard} />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <ACard label="Active Enrollments" value={22} icon={I.trending} />
        <ACard label="Inactive Students" value={2} sub="No activity 7+ days" icon={I.alert} />
        <ACard label="Completed Courses" value={1} icon={I.award} />
        <ACard label="Completion Rate" value="71%" sub="+4% this month" icon={I.chart} />
      </div>
      <div className="grid grid-cols-[1fr_300px] gap-6">
        {/* Falling behind */}
        <div>
          <h3 className="font-bold text-[#060B18] mb-4">Students Falling Behind</h3>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-3.5 bg-gray-50 border-b border-gray-100 text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              <span>Student</span><span>Progress</span><span>Last Active</span><span>Risk</span>
            </div>
            {instStudents.filter(s => s.risk || s.progress < 30).map(s => (
              <div key={s.name} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center border-b border-gray-50 last:border-0 hover:bg-red-50/30 transition-colors">
                <div className="flex items-center gap-3"><Av name={s.name} size={7} /><span className="text-sm font-semibold text-[#060B18]">{s.name}</span></div>
                <div className="flex items-center gap-2"><div className="w-14"><Bar value={s.progress} thin /></div><span className="text-xs font-mono text-red-500 font-bold">{s.progress}%</span></div>
                <span className="text-xs font-mono text-gray-400">{s.lastActive}</span>
                <Tag label="At risk" variant="danger" />
              </div>
            ))}
          </div>
        </div>

        {/* System health */}
        <div>
          <h3 className="font-bold text-[#060B18] mb-4">System Health</h3>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
            {[{ l: 'API Uptime', v: 99.98 }, { l: 'Code Sandbox', v: 97.4 }, { l: 'Storage Used', v: 63 }, { l: 'Email Delivery', v: 99.1 }].map(m => (
              <div key={m.l}>
                <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-500">{m.l}</span><span className="font-mono font-bold text-[#1D4ED8]">{m.v}%</span></div>
                <Bar value={m.v} thin />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminUsers() {
  const [search, setSearch] = useState('')
  const allUsers = [
    { name: 'Alexandra Chen', email: 'a.chen@optimum.edu', role: 'Student', enrolled: 1, joined: 'Aug 12, 2025', status: 'active' },
    { name: 'Jordan Lee', email: 'j.lee@optimum.edu', role: 'Student', enrolled: 1, joined: 'Aug 14, 2025', status: 'active' },
    { name: 'Dr. Sarah Kim', email: 's.kim@optimum.edu', role: 'Instructor', enrolled: 1, joined: 'Jan 5, 2025', status: 'active' },
    { name: 'Marcus Webb', email: 'm.webb@optimum.edu', role: 'Admin', enrolled: 0, joined: 'Dec 1, 2024', status: 'active' },
    { name: 'Priya Nair', email: 'p.nair@optimum.edu', role: 'Student', enrolled: 1, joined: 'Aug 10, 2025', status: 'inactive' },
    { name: 'Taylor Morgan', email: 't.morgan@optimum.edu', role: 'Student', enrolled: 1, joined: 'Sep 1, 2025', status: 'inactive' },
  ]
  const filtered = allUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-[#060B18] tracking-tight">Users</h2><p className="text-sm text-gray-400 mt-1">Manage students, instructors, and admins.</p></div>
        <button className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1D4ED8] text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"><Ic d={I.plus} s={14} />Add User</button>
      </div>
      <div className="flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1D4ED8] transition-colors w-64" />
        {[['All', '6'], ['Students', '4'], ['Instructors', '1'], ['Admins', '1']].map(([l, c]) => (
          <button key={l} className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 flex items-center gap-1.5">
            {l}<span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{c}</span>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1.5fr_1fr_80px] gap-4 px-6 py-3.5 bg-gray-50 border-b border-gray-100 text-[11px] font-mono text-gray-400 uppercase tracking-wider">
          <span>Name</span><span>Email</span><span>Role</span><span>Courses</span><span>Joined</span><span>Status</span><span></span>
        </div>
        {filtered.map((u, i) => (
          <div key={i} className="grid grid-cols-[2fr_2fr_1fr_1fr_1.5fr_1fr_80px] gap-4 px-6 py-4 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3"><Av name={u.name} size={8} /><span className="text-sm font-semibold text-[#060B18]">{u.name}</span></div>
            <span className="text-xs text-gray-400 font-mono truncate">{u.email}</span>
            <Tag label={u.role} variant={u.role === 'Instructor' ? 'default' : u.role === 'Admin' ? 'primary' : 'muted'} />
            <span className="text-sm font-mono text-gray-500">{u.enrolled}</span>
            <span className="text-xs font-mono text-gray-400">{u.joined}</span>
            <Tag label={u.status} variant={u.status === 'active' ? 'success' : 'muted'} />
            <div className="flex gap-1">
              <button className="p-1.5 text-gray-300 hover:text-[#1D4ED8] transition-colors"><Ic d={I.edit} s={13} /></button>
              <button className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"><Ic d={I.trash} s={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminCourses() {
  const courses = [
    { title: 'Full-Stack Web Development', inst: 'Dr. Sarah Kim', students: 24, modules: 9, status: 'published', rate: 71 },
    { title: 'Python for Data Science', inst: 'Priya Nair', students: 18, modules: 8, status: 'published', rate: 55 },
    { title: 'Mobile App with Flutter', inst: 'James Osei', students: 0, modules: 6, status: 'draft', rate: 0 },
    { title: 'DevOps & Cloud Fundamentals', inst: 'Dr. Sarah Kim', students: 0, modules: 7, status: 'review', rate: 0 },
  ]
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-[#060B18] tracking-tight">All Courses</h2><p className="text-sm text-gray-400 mt-1">Every course running on the platform.</p></div>
        <button className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1D4ED8] text-white rounded-xl text-sm font-bold hover:bg-blue-700"><Ic d={I.plus} s={14} />New Course</button>
      </div>
      <div className="flex flex-col gap-4">
        {courses.map(c => (
          <div key={c.title} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag label={c.status} variant={c.status === 'published' ? 'success' : c.status === 'review' ? 'warning' : 'muted'} />
                  <Tag label={`${c.modules} modules`} variant="muted" />
                </div>
                <h3 className="font-bold text-[#060B18] text-base">{c.title}</h3>
                <div className="flex items-center gap-2 mt-1.5"><Av name={c.inst} size={5} /><span className="text-xs text-gray-400">{c.inst}</span><span className="text-gray-200">·</span><span className="text-xs text-gray-400 font-mono">{c.students} students</span></div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:text-[#1D4ED8] hover:border-blue-200 transition-colors"><Ic d={I.eye} s={14} /></button>
                <button className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:text-[#1D4ED8] hover:border-blue-200 transition-colors"><Ic d={I.edit} s={14} /></button>
                <button className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:text-red-400 hover:border-red-200 transition-colors"><Ic d={I.trash} s={14} /></button>
              </div>
            </div>
            {c.status === 'published' && c.rate > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-400">Avg. completion rate</span><span className="font-mono font-bold text-[#1D4ED8]">{c.rate}%</span></div>
                <Bar value={c.rate} thin />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminAnalytics() {
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  const enroll = [8, 14, 18, 22, 24, 24]; const mx = Math.max(...enroll)
  return (
    <div className="flex flex-col gap-6 p-8">
      <div><h2 className="text-2xl font-bold text-[#060B18] tracking-tight">Analytics</h2><p className="text-sm text-gray-400 mt-1">Platform-wide enrolment and performance.</p></div>
      <div className="grid grid-cols-4 gap-4">
        <ACard label="Total Enrollments" value={22} sub="+4 this month" icon={I.trending} />
        <ACard label="Total Submissions" value={48} sub="+12 this week" icon={I.clipboard} />
        <ACard label="Completion Rate" value="71%" icon={I.award} />
        <ACard label="Active Daily" value={14} icon={I.users} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-[#060B18] mb-6">Enrollment Growth</h3>
          <div className="flex items-end gap-4 h-36">
            {months.map((m, i) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-xl bg-[#1D4ED8] hover:bg-blue-700 transition-colors group relative" style={{ height: `${(enroll[i] / mx) * 130}px` }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-xs font-mono text-[#1D4ED8]">{enroll[i]}</div>
                </div>
                <span className="text-xs text-gray-400 font-mono">{m}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-[#060B18] mb-4">Module Completion</h3>
          {modules.slice(0, 5).map(m => (
            <div key={m.id} className="mb-4 last:mb-0">
              <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-500">{m.title}</span><span className="font-mono font-bold text-[#1D4ED8]">{m.state === 'completed' ? '100%' : m.state === 'current' ? '33%' : '0%'}</span></div>
              <Bar value={m.state === 'completed' ? 100 : m.state === 'current' ? 33 : 0} thin />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminSettings() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div><h2 className="text-2xl font-bold text-[#060B18] tracking-tight">Platform Settings</h2><p className="text-sm text-gray-400 mt-1">Configuration for the whole platform.</p></div>
      <div className="grid grid-cols-[200px_1fr] gap-8">
        <div className="flex flex-col gap-1">
          {['General', 'Security', 'Notifications', 'Code Sandbox', 'Submissions', 'Integrations', 'Advanced'].map((s, i) => (
            <button key={s} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${i === 0 ? 'bg-blue-50 text-[#1D4ED8]' : 'text-gray-500 hover:bg-gray-50'}`}>{s}</button>
          ))}
        </div>
        <div className="flex flex-col gap-6">
          {[{ l: 'Platform Name', v: 'Optimum LMS', t: 'text' }, { l: 'Support Email', v: 'support@optimumsystems.co.ke', t: 'email' }, { l: 'Code Execution Timeout (sec)', v: '10', t: 'number' }, { l: 'Max Submission File Size', v: '50MB', t: 'text' }].map(f => (
            <div key={f.l}>
              <label className="text-xs font-semibold text-gray-400 block mb-2">{f.l}</label>
              <input defaultValue={f.v} type={f.t} className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1D4ED8] transition-colors" />
            </div>
          ))}
          <div className="flex flex-col gap-1 pt-2">
            {[['Enforce module locking on backend (Django)', true], ['Auto-mark labs NOT COMPLETED after deadline', true], ['Allow multiple quiz attempts by default', false], ['Email alerts for students falling behind', true], ['Require instructor approval for publishing', true]].map(([l, on]) => (
              <div key={l as string} className="flex items-center justify-between py-3.5 border-b border-gray-50">
                <span className="text-sm text-[#060B18] pr-8">{l as string}</span>
                <div className={`w-10 h-5 rounded-full relative cursor-pointer shrink-0 transition-colors ${on ? 'bg-[#1D4ED8]' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-5' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button className="px-6 py-2.5 bg-[#1D4ED8] text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">Save Changes</button>
            <button className="px-6 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminPortal({ user, onExit }: { user: CurrentUser; onExit: () => void }) {
  const [page, setPage] = useState<AdminPage>('home')
  const titles: Record<AdminPage, string> = { home: 'Platform Overview', users: 'User Management', courses: 'Course Catalogue', analytics: 'Analytics', settings: 'Settings' }
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar page={page} setPage={setPage} onExit={onExit} user={user} />
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F7FB]">
        <ATopBar title={titles[page]} user={user} />
        <div className="flex-1 overflow-y-auto">
          {page === 'home' && <AdminHome />}
          {page === 'users' && <AdminUsers />}
          {page === 'courses' && <AdminCourses />}
          {page === 'analytics' && <AdminAnalytics />}
          {page === 'settings' && <AdminSettings />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════

function InsecureBackendNotice() {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
      <div className="max-w-md bg-white border border-red-200 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <Ic d={I.shield} s={22} w={1.8} />
        </div>
        <h1 className="font-bold text-lg text-red-900 mb-2">Insecure backend URL</h1>
        <p className="text-sm text-red-700 leading-relaxed">
          This build is configured to send login credentials to a plain <span className="font-mono">http://</span> address in production.
          Set <span className="font-mono">VITE_API_URL</span> to an <span className="font-mono">https://</span> address and rebuild before deploying.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [role, setRole] = useState<Role>('none')
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  if (isInsecureApiUrl) return <InsecureBackendNotice />

  // On load, if a token is already stored (from a previous visit), try to
  // restore the session instead of forcing the person to log in again.
  useEffect(() => {
    if (!hasSession()) { setCheckingSession(false); return }
    getCurrentUser()
      .then(u => { setUser(u); setRole(u.role) })
      .catch(() => apiLogout())
      .finally(() => setCheckingSession(false))
  }, [])

  function handleExit() {
    apiLogout()
    setUser(null)
    setRole('none')
  }

  function handleLoggedIn(u: CurrentUser) {
    setUser(u)
    setRole(u.role)
  }

  if (checkingSession) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  }
  if (role === 'none' || !user) return <PortalSelect onSelect={handleLoggedIn} />
  if (role === 'student') return <StudentPortal user={user} onExit={handleExit} />
  if (role === 'instructor') return <InstructorPortal user={user} onExit={handleExit} />
  if (role === 'admin') return <AdminPortal user={user} onExit={handleExit} />
  return null
}
