import { useState } from 'react'
import { getStudentDashboard } from '../api/dashboard'
import { getGamification } from '../api/gamification'
import { getStudentAnalytics } from '../api/analytics'
import { getCurrentCourseModules } from '../api/modules'
import { useApiData } from '../hooks/useApiData'
import { useToast } from '../hooks/useToast'
import { Card, Ring, AreaChart, Radar, Heatmap, Donut, DonutLegend, LearningPath, KpiCard, Hero, HeroButton, Pill, ProgressBar } from '../components/ui'
import { Skeleton, ErrorState, EmptyState } from '../components/ui/DataStates'
import { StudentUpNext, VideoPlayer, type VideoLesson } from '../components/VideoPlayer'
import { FocusTimer } from '../components/FocusTimer'
import { Modal } from '../components/ui/Modal'

const GREETING = (() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})()
const TODAY = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

export function StudentDashboard({ studentName }: { studentName: string }) {
  const dash = useApiData(getStudentDashboard)
  const gam = useApiData(getGamification)
  const analytics = useApiData(getStudentAnalytics)
  const modules = useApiData(getCurrentCourseModules)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const toast = useToast()

  const moduleProgressPct = dash.data ? Math.round((dash.data.lessonsCompleted / Math.max(dash.data.lessonsTotal, 1)) * 100) : 0

  // The two active lessons for the video panel come from the lesson list your
  // course-content API already exposes; wire `videos` to that instead of this
  // placeholder once it's available. Kept deliberately minimal here since the
  // reference's VL[] array had no direct backend equivalent in this project yet.
  const videos: VideoLesson[] = dash.data
    ? [
        { id: 'current', title: dash.data.currentModule.title, source: 'Current lesson', status: 'now' },
      ]
    : []

  return (
    <main style={{ padding: '22px 26px 40px', minWidth: 0 }}>
      <Hero
        day={TODAY}
        title={`${GREETING}, ${studentName.split(' ')[0]}.`}
        side={
          dash.data && (
            <Ring pct={moduleProgressPct} sub={<>module<br />complete</>} />
          )
        }
      >
        {dash.loading && <Skeleton height={60} />}
        {dash.error && <ErrorState message={dash.error} onRetry={dash.reload} />}
        {dash.data && (
          <>
            <p>
              You're on module {dash.data.currentModule.number} of {dash.data.currentModule.totalModules}: {dash.data.currentModule.title}.{' '}
              {dash.data.pendingLabsCount > 0 ? `${dash.data.pendingLabsCount} lab(s) pending.` : 'All caught up on labs.'}
            </p>
            <div className="dg-bt">
              <HeroButton onClick={() => document.getElementById('dg-video')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                ▶ Resume lesson
              </HeroButton>
              <HeroButton ghost onClick={() => setScheduleOpen(true)}>
                View schedule
              </HeroButton>
            </div>
          </>
        )}
      </Hero>

      <div className="dg-grid">
        {dash.loading && [0, 1, 2, 3].map((i) => <Card key={i} span={3}><Skeleton /></Card>)}
        {dash.data && (
          <>
            <KpiCard
              label="Lessons completed"
              value={dash.data.lessonsCompleted}
              suffix={` / ${dash.data.lessonsTotal}`}
              delta={`+${dash.data.lessonsCompletedThisWeek} this week`}
              icon="check"
              spark={[8, 9, 10, 10, 11, 13, dash.data.lessonsCompleted]}
            />
            <KpiCard
              label="Average grade"
              value={dash.data.averageGradePct}
              suffix="%"
              delta={`${dash.data.averageGradeDeltaPct >= 0 ? '+' : ''}${dash.data.averageGradeDeltaPct} pts vs last module`}
              icon="star"
              spark={[78, 80, 85, 83, 88, 90, dash.data.averageGradePct]}
            />
            <KpiCard
              label="Pending labs"
              value={dash.data.pendingLabsCount}
              delta={dash.data.pendingLabsCount > 0 ? 'Due soon' : 'All clear'}
              warn={dash.data.pendingLabsCount > 0}
              icon="flask"
              spark={[1, 2, 1, 3, 2, 3, dash.data.pendingLabsCount]}
            />
            <KpiCard
              label="Study streak"
              value={gam.data?.currentStreakDays ?? 0}
              suffix=" days"
              delta={gam.data ? `Best: ${gam.data.longestStreakDays} days` : ''}
              icon="trend"
              spark={[1, 2, 3, 1, 4, 5, gam.data?.currentStreakDays ?? 0]}
            />
          </>
        )}

        <Card span={12}>
          <h3>Your learning path</h3>
          <div className="dg-sub">Progress through this course</div>
          {modules.loading && <Skeleton height={150} />}
          {modules.error && <ErrorState message={modules.error} onRetry={modules.reload} />}
          {modules.data && modules.data.length > 0 && (
            <LearningPath
              modules={modules.data}
              completedPct={(modules.data.filter((m) => m.status === 'done').length / modules.data.length) * 100}
            />
          )}
          {modules.data && modules.data.length === 0 && <EmptyState message="No modules yet." />}
        </Card>

        <div id="dg-video" className="dg-c8">
          {videos.length > 0 && <VideoPlayer videoId="dQw4w9WgXcQ" title={videos[0].title} subtitle={videos[0].source} />}
        </div>
        <StudentUpNext lessons={videos} activeId={videos[0]?.id ?? ''} />

        <Card span={5}>
          <h3>Skill radar</h3>
          <div className="dg-sub">Proficiency by topic</div>
          {analytics.loading && <Skeleton height={260} />}
          {analytics.error && <ErrorState message={analytics.error} onRetry={analytics.reload} />}
          {analytics.data && (
            <Radar labels={analytics.data.skillRadar.map((s) => s.topic)} values={analytics.data.skillRadar.map((s) => s.score)} />
          )}
        </Card>

        <Card span={7}>
          <h3>Grade trend</h3>
          <div className="dg-sub">Last {analytics.data?.gradeTrend.length ?? '—'} assessments</div>
          {analytics.loading && <Skeleton height={220} />}
          {analytics.data && (
            <AreaChart values={analytics.data.gradeTrend.map((t) => t.score)} labels={analytics.data.gradeTrend.map((t) => t.label)} />
          )}
        </Card>

        <Card span={5}>
          <h3>Activity</h3>
          <div className="dg-sub">Lessons and labs, last 12 weeks</div>
          {analytics.loading && <Skeleton height={150} />}
          {analytics.data && <Heatmap values={analytics.data.activityHeatmap} weeks={12} />}
        </Card>

        <Card span={4}>
          <h3>Time by topic</h3>
          <div className="dg-sub">This module</div>
          {analytics.data && (
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <Donut
                slices={analytics.data.timeByTopic.map((t, i) => ({
                  label: t.topic,
                  value: t.minutes,
                  color: ['#6D4AFF', '#9C85FF', '#C4B2FF', '#E3DBFF'][i % 4],
                }))}
              />
              <div style={{ flex: 1 }}>
                <DonutLegend
                  slices={analytics.data.timeByTopic.map((t, i) => ({
                    label: t.topic,
                    value: t.minutes,
                    color: ['#6D4AFF', '#9C85FF', '#C4B2FF', '#E3DBFF'][i % 4],
                  }))}
                />
              </div>
            </div>
          )}
        </Card>

        <Card span={3}>
          <h3>Cohort standing</h3>
          {gam.data && <div className="dg-sub">Top {100 - gam.data.cohortPercentile}% of {gam.data.cohortSize}</div>}
          {analytics.data?.cohortLeaderboard.map((entry) => (
            <div key={entry.name} style={{ margin: '12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: entry.isYou ? 700 : 400 }}>
                <span>{entry.name}</span>
                <span>{entry.percentile}</span>
              </div>
              <ProgressBar pct={entry.percentile} />
            </div>
          ))}
        </Card>

        <FocusTimer />

        <Card span={6}>
          <h3>Upcoming</h3>
          <div className="dg-sub">Due soon</div>
          {dash.data?.upcomingDeadlines.map((d) => (
            <div key={d.title} className="dg-row">
              <div className="dg-g">
                <b>{d.title}</b>
                <small>
                  {d.date} {d.urgent ? '· urgent' : `· ${d.type}`}
                </small>
              </div>
              <button className="dg-gb dg-g2" onClick={() => toast(`${d.title}: reminder set`)}>
                {d.type === 'lab' ? 'Start lab' : 'Preview'}
              </button>
            </div>
          ))}
        </Card>

        <Card span={6}>
          <h3>Recent results</h3>
          <div className="dg-sub">Latest graded work</div>
          {dash.data?.recentResults.map((r) => (
            <div key={r.title} className="dg-row">
              <div className="dg-g">
                <b>{r.title}</b>
                <ProgressBar pct={r.grade} />
              </div>
              <Pill tone="g">{r.grade}%</Pill>
            </div>
          ))}
        </Card>
      </div>

      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Your schedule">
        {dash.data?.upcomingDeadlines.map((d) => (
          <div key={d.title} className="dg-row">
            <div className="dg-g">
              <b>{d.title}</b>
              <small>{d.date}</small>
            </div>
          </div>
        ))}
        <div className="dg-bt" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="dg-gb" onClick={() => setScheduleOpen(false)}>
            Done
          </button>
        </div>
      </Modal>
    </main>
  )
}
