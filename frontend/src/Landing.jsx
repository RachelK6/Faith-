import { Helmet } from 'react-helmet-async'
import { ArrowRight, BriefcaseBusiness, GraduationCap, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const SITE_URL = 'https://www.yourdomain.com'

const workspaces = [
  { title: 'Student', description: 'Continue lessons, submit labs, and track your grades.', icon: GraduationCap },
  { title: 'Instructor', description: 'Manage courses, review submissions, and support students.', icon: BriefcaseBusiness },
  { title: 'Administrator', description: 'Manage users, enrollments, courses, and platform health.', icon: ShieldCheck },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Helmet>
        <title>Optimum ERP LMS</title>
        <meta name="description" content="A secure learning workspace for students, instructors, and administrators." />
        <link rel="canonical" href={SITE_URL} />
      </Helmet>

      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-coral text-sm text-white">O</span>
            Optimum LMS
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/register" className="hidden text-text-muted hover:text-ink sm:block">Create account</Link>
            <Link to="/login" className="rounded-lg bg-ink px-4 py-2 font-medium text-white hover:bg-coral">Log in</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-ink text-white">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral">Learning workspace</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">One secure place to learn, teach, and manage.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">Sign in with your account and Optimum LMS opens the workspace for your role.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-coral px-6 py-3 font-semibold text-white hover:bg-coral-dim">Sign in <ArrowRight size={17} /></Link>
              <Link to="/register" className="text-sm font-semibold text-white/75 hover:text-white">Create a student account</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-coral">Your workspace</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Sign in once. Get the right view.</h2>
            </div>
            <span className="hidden text-sm text-text-muted md:block">Access is controlled by your account role.</span>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {workspaces.map(({ title, description, icon: Icon }) => (
              <Link key={title} to="/login" className="group rounded-2xl border border-line bg-paper p-6 transition hover:-translate-y-1 hover:border-coral hover:shadow-lg">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-coral-tint text-coral-dim"><Icon size={22} /></span>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-text-muted">{description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-coral-dim">Go to sign in <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-text-dim">
          <span className="font-semibold text-ink">Optimum ERP LMS</span>
          <span>Secure role-based access</span>
        </div>
      </footer>
    </div>
  )
}
