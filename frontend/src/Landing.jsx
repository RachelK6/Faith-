import { Helmet } from 'react-helmet-async'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const SITE_URL = 'https://www.yourdomain.com'

const stats = [
  { value: '12+', label: 'learning paths' },
  { value: '98%', label: 'course completion' },
  { value: '24/7', label: 'support access' },
]

const workspaces = [
  {
    title: 'Student',
    description: 'Continue lessons, submit lab work, and keep momentum with guided progress tracking.',
    icon: GraduationCap,
  },
  {
    title: 'Instructor',
    description: 'Manage curriculum, review submissions, and guide learners through each module.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Administrator',
    description: 'Monitor platform health, manage enrollments, and keep the learning ecosystem running.',
    icon: ShieldCheck,
  },
]

const highlights = [
  {
    icon: BookOpen,
    title: 'Structured learning journeys',
    text: 'Every course is broken into clear modules, labs, and assessments so students know what to do next.',
  },
  {
    icon: BarChart3,
    title: 'Progress visibility',
    text: 'Learners and instructors can quickly see what is complete, due, and ready for feedback.',
  },
  {
    icon: Users,
    title: 'Role-aware workflows',
    text: 'Students, teachers, and admins see only the tools and data relevant to their account.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Helmet>
        <title>Optimum ERP LMS</title>
        <meta
          name="description"
          content="A secure learning workspace for students, instructors, and administrators."
        />
        <link rel="canonical" href={SITE_URL} />
      </Helmet>

      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-base font-bold text-white shadow-lg shadow-violet-200">
              O
            </span>
            <div className="leading-none">
              <div className="text-lg font-extrabold tracking-tight text-slate-900">Optimum</div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">LMS</div>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <Link to="/register" className="hidden rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex">
              Create account
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-white shadow-sm transition hover:bg-violet-600"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-[radial-gradient(circle_at_top,_rgba(109,74,255,0.18),_transparent_38%),linear-gradient(135deg,#0f172a_0%,#111827_35%,#1f2937_100%)] text-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
                <Sparkles size={12} />
                Learning workspace
              </div>

              <h1 className="mt-6 max-w-xl text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
                One secure place to learn, teach, and manage.
              </h1>

              <p className="mt-5 max-w-lg text-base leading-8 text-slate-300 md:text-lg">
                Optimum LMS gives students a clear path through each course, helps instructors guide progress,
                and gives admins an operational view of the entire learning platform.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-400"
                >
                  Sign in
                  <ArrowRight size={17} />
                </Link>
                <Link to="/register" className="text-sm font-semibold text-slate-200 transition hover:text-white">
                  Create a student account
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-4 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  Structured courses
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  Role-based access
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  Real-time progress
                </span>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-violet-950/20 backdrop-blur-sm">
              <div className="rounded-[22px] bg-white p-5 text-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Platform overview</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight">Learning at a glance</h2>
                  </div>
                  <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
                    <BookOpen size={22} />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl bg-slate-50 p-4 text-center">
                      <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    ['HTML Fundamentals', 'Completed'],
                    ['CSS Fundamentals', 'Completed'],
                    ['JavaScript', 'In progress'],
                  ].map(([course, status], index) => (
                    <div key={course} className="rounded-2xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-800">{course}</p>
                          <p className="mt-1 text-xs text-slate-500">Module {index + 1} of 9</p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                            status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">Your workspace</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Built for the way people actually learn.
              </h2>
            </div>
            <span className="text-sm text-slate-500">Access is controlled by the role attached to your account.</span>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {workspaces.map(({ title, description, icon: Icon }) => (
              <Link
                key={title}
                to="/login"
                className="group rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Icon size={22} />
                </span>
                <h3 className="mt-6 text-xl font-bold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
                  Go to sign in
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">Why learners stay engaged</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Clear structure. Better momentum. Better outcomes.
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {highlights.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-6 text-xl font-bold text-slate-900">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span className="font-semibold text-slate-900">Optimum ERP LMS</span>
          <span>Secure role-based access</span>
        </div>
      </footer>
    </div>
  )
}
