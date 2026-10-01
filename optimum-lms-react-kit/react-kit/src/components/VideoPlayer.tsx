import { useEffect, useRef, useState } from 'react'
import { Icon } from './ui/icons'
import { fmtTime } from './ui/chartMath'

export type VideoLesson = { id: string; title: string; source: string; status: 'now' | 'locked' | 'available' }

const ORIGIN_ALLOW = /(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$/

/** Parses a YouTube URL/ID in any common form. Returns the 11-char video id, or null if invalid. */
export function parseYoutubeId(input: string): string | null {
  const m = input.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/) || input.match(/^([\w-]{11})$/)
  return m ? m[1] : null
}

type PlayerState = { playing: boolean; muted: boolean; t: number; d: number; speedIdx: number; blocked: boolean }

/**
 * Shared player core (poster, custom controls, postMessage bridge). Used by both
 * <StudentVideoPanel> and <InstructorVideoPanel> below — the picker UI differs
 * by role, the player itself does not.
 */
export function VideoPlayer({
  videoId,
  title,
  subtitle,
  onVideoIdChange,
}: {
  videoId: string
  title: string
  subtitle: string
  onVideoIdChange?: (id: string) => void
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)
  const [state, setState] = useState<PlayerState>({ playing: false, muted: false, t: 0, d: 0, speedIdx: 0, blocked: false })

  // Reset player chrome whenever the video changes.
  useEffect(() => {
    setLive(false)
    setState({ playing: false, muted: false, t: 0, d: 0, speedIdx: 0, blocked: false })
  }, [videoId])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!ORIGIN_ALLOW.test(new URL(e.origin).hostname)) return
      let data: any
      try {
        data = JSON.parse(e.data)
      } catch {
        return
      }
      if (data.event === 'infoDelivery' && data.info) {
        setState((s) => ({
          ...s,
          t: data.info.currentTime ?? s.t,
          d: data.info.duration ?? s.d,
          playing: data.info.playerState != null ? data.info.playerState === 1 : s.playing,
        }))
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onCsp = (e: SecurityPolicyViolationEvent) => {
      if (/frame|child/.test(e.violatedDirective)) setState((s) => ({ ...s, blocked: true }))
    }
    document.addEventListener('securitypolicyviolation', onCsp)
    return () => document.removeEventListener('securitypolicyviolation', onCsp)
  }, [])

  const send = (func: string, args: any[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*')
  }

  const play = () => {
    if (!live) {
      setLive(true)
      return
    }
    send(state.playing ? 'pauseVideo' : 'playVideo')
  }

  const speeds = [1, 1.25, 1.5, 2]

  const iframeSrc = live
    ? `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&controls=0&rel=0&modestbranding=1&playsinline=1&autoplay=1&origin=${encodeURIComponent(window.location.origin)}`
    : undefined

  const pct = state.d ? (state.t / state.d) * 100 : 0

  return (
    <div className="dg-card dg-c8" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        ref={wrapRef}
        className={`dg-vp${live ? ' dg-live' : ''}${state.playing ? ' dg-pl' : ''}${state.blocked ? ' dg-err' : ''}`}
      >
        <div className="dg-poster">
          <div>
            <button className="dg-pbtn" onClick={play} aria-label="Play lesson">
              <Icon name="play" filled size={30} />
            </button>
            <div className="dg-pt">{title}</div>
            <small style={{ color: '#ffffffb8' }}>{subtitle}</small>
            <div className="dg-emsg">
              This environment may block embedded video (CSP). In production it plays inline.{' '}
              <a href={`https://youtu.be/${videoId}`} target="_blank" rel="noopener noreferrer">
                Watch on YouTube
              </a>
            </div>
          </div>
        </div>
        {live && <iframe ref={iframeRef} title="Lesson video" src={iframeSrc} allow="autoplay; fullscreen; encrypted-media" allowFullScreen />}
        <button className="dg-hit" aria-label="Toggle play" onClick={play} />
        <div className="dg-ctl">
          <div
            className="dg-sc"
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            tabIndex={0}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              if (state.d) send('seekTo', [((e.clientX - rect.left) / rect.width) * state.d, true])
            }}
          >
            <i style={{ width: `${pct}%` }} />
            <b style={{ left: `${pct}%` }} />
          </div>
          <div className="dg-r">
            <button onClick={play} aria-label="Play or pause">
              <Icon name={state.playing ? 'pause' : 'play'} filled />
            </button>
            <button
              onClick={() => {
                setState((s) => ({ ...s, muted: !s.muted }))
                send(state.muted ? 'unMute' : 'mute')
              }}
              aria-label="Mute"
            >
              <Icon name={state.muted ? 'mute' : 'volume'} />
            </button>
            <span style={{ fontSize: 12, marginLeft: 6 }}>
              {fmtTime(state.t)} / {fmtTime(state.d)}
            </span>
            <span style={{ flex: 1 }} />
            <button
              onClick={() => {
                const idx = (state.speedIdx + 1) % speeds.length
                setState((s) => ({ ...s, speedIdx: idx }))
                send('setPlaybackRate', [speeds[idx]])
              }}
              aria-label="Playback speed"
            >
              {speeds[state.speedIdx]}×
            </button>
            <button
              onClick={() => (document.fullscreenElement ? document.exitFullscreen() : wrapRef.current?.requestFullscreen())}
              aria-label="Fullscreen"
            >
              <Icon name="expand" />
            </button>
          </div>
        </div>
      </div>
      <div className="dg-vm">
        <div style={{ flex: 1 }}>
          <b>{title}</b>
          <small>{subtitle}</small>
        </div>
      </div>
    </div>
  )
}

/** Student view: read-only "up next" list. No free-text input — students cannot load arbitrary videos. */
export function StudentUpNext({ lessons, activeId }: { lessons: VideoLesson[]; activeId: string }) {
  return (
    <div className="dg-card dg-c4">
      <h3>Up next</h3>
      <div className="dg-sub">Later in this module</div>
      {lessons.map((l) => (
        <div key={l.id} className={`dg-li${l.id === activeId ? ' dg-on' : ''}`} data-locked={l.status === 'locked' ? '' : undefined}>
          <span className="dg-th">
            <i /> <i /> <i />
          </span>
          <span>
            <b>{l.title}</b>
            <small>{l.source}</small>
          </span>
          <span className={`dg-pill${l.id === activeId ? ' dg-g' : ''}`} style={{ marginLeft: 'auto' }}>
            {l.id === activeId ? 'Now playing' : l.status === 'locked' ? 'Locked' : 'Available'}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Instructor view: pick from the library, or paste any YouTube link to attach it to the lesson. */
export function InstructorVideoPicker({
  lessons,
  activeId,
  onSelect,
  onAttachLink,
}: {
  lessons: VideoLesson[]
  activeId: string
  onSelect: (id: string) => void
  onAttachLink: (id: string) => void
}) {
  const [link, setLink] = useState('')
  const [bad, setBad] = useState(false)

  return (
    <div className="dg-card dg-c4">
      <h3>Lesson video</h3>
      <div className="dg-sub">Choose what students see, or attach your own</div>
      {lessons.map((l) => (
        <button key={l.id} className={`dg-li${l.id === activeId ? ' dg-on' : ''}`} onClick={() => onSelect(l.id)}>
          <span className="dg-th">
            <i /> <i /> <i />
          </span>
          <span>
            <b>{l.title}</b>
            <small>{l.source}</small>
          </span>
        </button>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <input
          className={`dg-yi${bad ? ' dg-bad' : ''}`}
          placeholder="Paste a YouTube link"
          aria-label="YouTube link"
          value={link}
          onChange={(e) => {
            setLink(e.target.value)
            setBad(false)
          }}
        />
        <button
          className="dg-gb"
          onClick={() => {
            const id = parseYoutubeId(link)
            if (!id) {
              setBad(true)
              return
            }
            onAttachLink(id)
            setLink('')
          }}
        >
          Attach
        </button>
      </div>
    </div>
  )
}
