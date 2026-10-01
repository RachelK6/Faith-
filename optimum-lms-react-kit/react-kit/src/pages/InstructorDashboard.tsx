import { useState } from 'react'
import { getInstructorDashboard, submitGrade } from '../api/instructorDashboard'
import { getEnrollments } from '../api/enrollments'
import { getCohortRisk } from '../api/risk'
import { sendMessage } from '../api/messages'
import { updateLessonVideo } from '../api/modules'
import { useApiData } from '../hooks/useApiData'
import { useToast } from '../hooks/useToast'
import { Card, Donut, DonutLegend, AreaChart, BarChart, Hero, HeroButton, Avatar, Pill, KpiCard } from '../components/ui'
import { Skeleton, ErrorState, EmptyState } from '../components/ui/DataStates'
import { InstructorVideoPicker, VideoPlayer, type VideoLesson } from '../components/VideoPlayer'
import { GradeModal } from '../components/GradeModal'
import { ComposeModal } from '../components/ComposeModal'

const GREETING = (() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})()
const TODAY = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

const RANGE_LABELS = ['8w', '12w', 'term'] as const

export function InstructorDashboard({ instructorName }: { instructorName: string }) {
  const dash = useApiData(getInstructorDashboard)
  const enrollments = useApiData(getEnrollments)
  const risk = useApiData(getCohortRisk)
  const toast = useToast()

  const [range, setRange] = useState<(typeof RANGE_LABELS)[number]>('8w')
  const [grading, setGrading] = useState<{ id: string; name: string; title: string } | null>(null)
  const [messaging, setMessaging] = useState<{ id: string; name: string } | null>(null)
  const [videos, setVideos] = useState<VideoLesson[]>([
    { id: 'current', title: 'Current lesson video', source: 'Attached to this lesson', status: 'now' },
  ])
  const [activeVideoId, setActiveVideoId] = useState('current')

  const riskCounts = risk.data
    ? {
        onTrack: risk.data.scored.filter((s) => s.risk_level === 'low').length,
        slipping: risk.data.scored.filter((s) => s.risk_level === 'medium').length,
        atRisk: risk.data.scored.filter((s) => s.risk_level === 'high').length,
      }
    : null

  return (
    <main style={{ padding: '22px 26px 40px', minWidth: 0 }}>
      <Hero day={TODAY} title={`${GREETING}, ${instructorName}.`} side={undefined}>
        {dash.loading && <Skeleton height={60} />}
        {dash.error && <ErrorState message={dash.error} onRetry={dash.reload} />}
        {dash.data && (
          <>
            <p>
              {dash.data.enrolledCount} students enrolled this term. {dash.data.pendingReviewCount} submission(s) waiting
              {dash.data.atRiskCount > 0 ? ` and ${dash.data.atRiskCount} need a check-in.` : '.'}
            </p>
            <div className="dg-bt">
              <HeroButton
                onClick={() => {
                  const first = dash.data?.pendingSubmissions[0]
                  if (first) setGrading({ id: first.student_id, name: first.student_name, title: first.assignment })
                  else toast('Nothing left to grade')
                }}
              >
                Start grading
              </HeroButton>
              <HeroButton
                ghost
                onClick={() => {
                  toast('Preparing report…')
                  setTimeout(() => toast('Report exported'), 1200)
                }}
              >
                Export report
              </HeroButton>
            </div>
          </>
        )}
      </Hero>

      <div className="dg-grid">
        {dash.loading && [0, 1, 2, 3].map((i) => <Card key={i} span={3}><Skeleton /></Card>)}
        {dash.data && (
          <>
            <KpiRow label="Enrolled students" value={dash.data.enrolledCount} delta={`+${dash.data.enrolledDeltaThisWeek} this week`} icon="users" />
            <KpiRow label="Pending reviews" value={dash.data.pendingReviewCount} delta="Needs attention" warn icon="check" />
            <KpiRow label="Cohort average" value={dash.data.cohortAverageGradePct} suffix="%" delta={`${dash.data.cohortAverageGradeDeltaPct >= 0 ? '+' : ''}${dash.data.cohortAverageGradeDeltaPct} pts vs last module`} icon="star" />
            <KpiRow label="At risk" value={dash.data.atRiskCount} delta="Reach out today" warn={dash.data.atRiskCount > 0} icon="alert" />
          </>
        )}

        <Card span={4}>
          <h3>Cohort health</h3>
          <div className="dg-sub">Predicted risk, all learners</div>
          {risk.loading && <Skeleton height={170} />}
          {risk.error && <ErrorState message={risk.error} onRetry={risk.reload} />}
          {riskCounts && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Donut
                  slices={[
                    { label: 'On track', value: riskCounts.onTrack, color: 'var(--acc)' },
                    { label: 'Slipping', value: riskCounts.slipping, color: 'var(--warn)' },
                    { label: 'At risk', value: riskCounts.atRisk, color: 'var(--bad)' },
                  ]}
                  size={170}
                  width={26}
                />
              </div>
              <DonutLegend
                slices={[
                  { label: 'On track', value: riskCounts.onTrack, color: 'var(--acc)' },
                  { label: 'Slipping', value: riskCounts.slipping, color: 'var(--warn)' },
                  { label: 'At risk', value: riskCounts.atRisk, color: 'var(--bad)' },
                ]}
              />
            </>
          )}
        </Card>

        <Card span={8}>
          <div className="dg-ch">
            <div>
              <h3>Average progress</h3>
              <div className="dg-sub">Cohort completion across the term</div>
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
              values={dash.data.weeklyProgress[range].map((p) => p.pct)}
              labels={dash.data.weeklyProgress[range].map((p) => p.label)}
              width={640}
              height={240}
            />
          )}
        </Card>

        <Card span={6}>
          <h3>Grade distribution</h3>
          <div className="dg-sub">Students per band</div>
          {dash.data && <BarChart data={dash.data.gradeDistribution.map((g) => ({ label: g.label, value: g.count }))} />}
        </Card>

        <Card span={6}>
          <h3>Needs a check-in</h3>
          <div className="dg-sub">Sorted by risk</div>
          {risk.data?.scored
            .filter((s) => s.risk_level !== 'low')
            .map((s) => (
              <div key={s.student_id} className="dg-row">
                <Avatar name={s.student_id} />
                <div className="dg-g">
                  <b>{s.student_id}</b>
                  <small>{s.top_factors.join(', ')}</small>
                </div>
                <Pill tone={s.risk_level === 'high' ? 'r' : 'y'}>{Math.round(s.risk_probability * 100)}%</Pill>
                <button className="dg-gb dg-g2" onClick={() => setMessaging({ id: s.student_id, name: s.student_id })}>
                  Message
                </button>
              </div>
            ))}
          {risk.data?.scored.filter((s) => s.risk_level !== 'low').length === 0 && <EmptyState message="Everyone is on track." />}
        </Card>

        <VideoPlayer videoId="dQw4w9WgXcQ" title={videos.find((v) => v.id === activeVideoId)?.title ?? ''} subtitle="Module video" />
        <InstructorVideoPicker
          lessons={videos}
          activeId={activeVideoId}
          onSelect={setActiveVideoId}
          onAttachLink={async (id) => {
            setActiveVideoId(id)
            setVideos((v) => [{ id, title: 'Attached video', source: 'Pasted link', status: 'now' }, ...v])
            try {
              await updateLessonVideo('current', `https://youtu.be/${id}`)
              toast('Video attached to lesson')
            } catch {
              toast('Could not save — try again')
            }
          }}
        />

        <Card span={12}>
          <h3>Grading queue</h3>
          <div className="dg-sub">Oldest first</div>
          {enrollments.loading && <Skeleton height={80} />}
          {dash.data?.pendingSubmissions.map((s) => (
            <div key={s.student_id + s.assignment} className="dg-row">
              <Avatar name={s.student_name} />
              <div className="dg-g">
                <b>{s.student_name}</b>
                <small>
                  {s.assignment} · submitted {s.submitted}
                </small>
              </div>
              <Pill tone={s.type === 'lab' ? 'y' : 'default'}>{s.type === 'lab' ? 'Lab' : 'Quiz'}</Pill>
              <button className="dg-gb" onClick={() => setGrading({ id: s.student_id, name: s.student_name, title: s.assignment })}>
                Grade
              </button>
            </div>
          ))}
        </Card>
      </div>

      <GradeModal
        open={!!grading}
        onClose={() => setGrading(null)}
        studentName={grading?.name ?? ''}
        assignmentTitle={grading?.title ?? ''}
        onSubmit={async (score, feedback) => {
          if (!grading) return
          await submitGrade({ submissionId: grading.id, score, feedback })
          toast(`Graded ${grading.name}: ${score}/100`)
          dash.reload()
        }}
      />

      <ComposeModal
        open={!!messaging}
        onClose={() => setMessaging(null)}
        title={`Message ${messaging?.name ?? ''}`}
        onSend={async (body) => {
          if (!messaging) return
          await sendMessage({ toStudentId: messaging.id, body })
          toast('Message sent')
        }}
      />
    </main>
  )
}

function KpiRow({
  label,
  value,
  delta,
  warn,
  icon,
  suffix = '',
}: {
  label: string
  value: number
  delta: string
  warn?: boolean
  icon: 'users' | 'check' | 'star' | 'alert'
  suffix?: string
}) {
  return (
    <KpiCard
      label={label}
      value={value}
      suffix={suffix}
      delta={delta}
      warn={warn}
      icon={icon}
      spark={[value * 0.7, value * 0.8, value * 0.85, value * 0.9, value * 0.95, value * 0.98, value]}
    />
  )
}
