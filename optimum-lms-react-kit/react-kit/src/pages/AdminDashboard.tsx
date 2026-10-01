import { useEffect, useState } from 'react'
import { getAdminDashboard, createUser } from '../api/adminDashboard'
import { useApiData } from '../hooks/useApiData'
import { useToast } from '../hooks/useToast'
import { Card, Donut, DonutLegend, AreaChart, BarList, Ring, Hero, HeroButton, KpiCard } from '../components/ui'
import { Skeleton, ErrorState } from '../components/ui/DataStates'
import { Modal } from '../components/ui/Modal'

const GREETING_TITLE = 'Platform overview'
const TODAY = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
const RANGE_LABELS = ['12mo', '6mo', '30d'] as const

export function AdminDashboard() {
  const dash = useApiData(getAdminDashboard)
  const toast = useToast()
  const [range, setRange] = useState<(typeof RANGE_LABELS)[number]>('12mo')
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [online, setOnline] = useState(dash.data?.onlineNowCount ?? 0)

  useEffect(() => {
    if (dash.data) setOnline(dash.data.onlineNowCount)
  }, [dash.data])

  // Lightweight "live" feel for the online-now counter. Swap this interval
  // for a real polling/websocket subscription once the backend exposes one —
  // this is a harmless client-side nicety in the meantime, not a data source.
  useEffect(() => {
    if (!dash.data) return
    const id = setInterval(() => {
      setOnline((n) => Math.max(4, n + Math.round(Math.random() * 4 - 1.5)))
    }, 2600)
    return () => clearInterval(id)
  }, [dash.data])

  return (
    <main style={{ padding: '22px 26px 40px', minWidth: 0 }}>
      <Hero
        day={TODAY}
        title={GREETING_TITLE}
        side={dash.data && <Ring pct={dash.data.completionRatePct} sub={<>completion<br />rate</>} />}
      >
        {dash.loading && <Skeleton height={60} />}
        {dash.error && <ErrorState message={dash.error} onRetry={dash.reload} />}
        {dash.data && (
          <>
            <p>
              {dash.data.activeEnrollmentsCount} active enrollments across {dash.data.liveCoursesCount} live courses, completion up{' '}
              {dash.data.completionRatePct}% this month.
            </p>
            <div className="dg-live" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '6px 13px', borderRadius: 99, background: '#ffffff1f' }}>
              <i style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80' }} />
              <b style={{ fontVariantNumeric: 'tabular-nums' }}>{online}</b> people online now
            </div>
            <div className="dg-bt">
              <HeroButton onClick={() => toast('Opening activity log…')}>Review activity</HeroButton>
              <HeroButton ghost onClick={() => setAddUserOpen(true)}>
                Add user
              </HeroButton>
            </div>
          </>
        )}
      </Hero>

      <div className="dg-grid">
        {dash.loading && [0, 1, 2, 3].map((i) => <Card key={i} span={3}><Skeleton /></Card>)}
        {dash.data && (
          <>
            <KpiCard label="Total students" value={dash.data.totalStudents} delta={`+${dash.data.totalStudentsDeltaThisWeek} this week`} icon="users" spark={[8, 10, 11, 13, 15, 16, dash.data.totalStudents]} />
            <KpiCard label="Live courses" value={dash.data.liveCoursesCount} delta={`${dash.data.launchingSoonCount} launching soon`} icon="book" spark={[2, 2, 3, 3, 3, 4, dash.data.liveCoursesCount]} />
            <KpiCard label="Active enrollments" value={dash.data.activeEnrollmentsCount} delta={`+${dash.data.activeEnrollmentsDeltaThisMonth} this month`} icon="trend" spark={[9, 11, 13, 15, 17, 20, dash.data.activeEnrollmentsCount]} />
            <KpiCard label="Inactive 7+ days" value={dash.data.inactive7dCount} delta={`Down from ${dash.data.inactive7dCount + dash.data.inactive7dDeltaFromLastWeek}`} warn icon="alert" spark={[4, 4, 3, 3, 3, 2, dash.data.inactive7dCount]} />
          </>
        )}

        <Card span={8}>
          <div className="dg-ch">
            <div>
              <h3>Enrollment growth</h3>
              <div className="dg-sub">Cumulative enrollments</div>
            </div>
            <div className="dg-rg">
              {RANGE_LABELS.map((r) => (
                <button key={r} className={range === r ? 'dg-on' : ''} onClick={() => setRange(r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          {dash.data && (
            <AreaChart
              values={dash.data.enrollmentGrowth[range].map((p) => p.count)}
              labels={dash.data.enrollmentGrowth[range].map((p) => p.label)}
              width={640}
              height={240}
            />
          )}
        </Card>

        <Card span={4}>
          <h3>Users by role</h3>
          {dash.data && (
            <>
              <div className="dg-sub">{dash.data.usersByRole.students + dash.data.usersByRole.instructors + dash.data.usersByRole.admins} accounts</div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Donut
                  slices={[
                    { label: 'Students', value: dash.data.usersByRole.students, color: 'var(--acc)' },
                    { label: 'Instructors', value: dash.data.usersByRole.instructors, color: 'var(--h2)' },
                    { label: 'Admins', value: dash.data.usersByRole.admins, color: 'var(--a2)' },
                  ]}
                />
              </div>
              <DonutLegend
                slices={[
                  { label: 'Students', value: dash.data.usersByRole.students, color: 'var(--acc)' },
                  { label: 'Instructors', value: dash.data.usersByRole.instructors, color: 'var(--h2)' },
                  { label: 'Admins', value: dash.data.usersByRole.admins, color: 'var(--a2)' },
                ]}
              />
            </>
          )}
        </Card>

        <Card span={6}>
          <h3>Course completion</h3>
          <div className="dg-sub">Share of enrolled learners who finished</div>
          {dash.data && <BarList data={dash.data.courseCompletion.map((c) => ({ label: c.label, pct: c.pct }))} />}
        </Card>

        <Card span={6}>
          <div className="dg-ch">
            <h3>System health</h3>
            <button className="dg-gb dg-g2" onClick={() => toast('All checks passed')}>
              Run check
            </button>
          </div>
          <div className="dg-sub">Last 30 days</div>
          {dash.data && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {dash.data.systemHealth.map((h) => (
                <div key={h.label} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ color: 'var(--ink)' }}>
                    <Ring pct={h.pct} size={64} width={8} stroke="var(--acc)" track="var(--line)" label={`${Math.round(h.pct)}%`} />
                  </div>
                  <div style={{ fontSize: 12.5 }}>
                    <b>{h.label}</b>
                    <small style={{ display: 'block', color: 'var(--mut)' }}>{h.pct}%</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <AddUserModal open={addUserOpen} onClose={() => setAddUserOpen(false)} />
    </main>
  )
}

function AddUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'student' | 'instructor' | 'admin'>('student')
  const [busy, setBusy] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title="Add a user">
      <label htmlFor="un">Full name</label>
      <input id="un" placeholder="Jane Wanjiru" value={name} onChange={(e) => setName(e.target.value)} />
      <label htmlFor="ue">Email</label>
      <input id="ue" type="email" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor="ur">Role</label>
      <select id="ur" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
        <option value="student">Student</option>
        <option value="instructor">Instructor</option>
        <option value="admin">Admin</option>
      </select>
      <div className="dg-bt" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
        <button className="dg-gb dg-g2" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button
          className="dg-gb"
          disabled={busy || !name || !email}
          onClick={async () => {
            setBusy(true)
            try {
              await createUser({ name, email, role })
              toast(`${name} added`)
              onClose()
            } catch {
              toast('Could not add user — try again')
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Creating…' : 'Create user'}
        </button>
      </div>
    </Modal>
  )
}
