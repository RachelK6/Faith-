// Single source of truth for lesson-video URLs. Mirrors
// backend/apps/courses/validators.py (classify_video_url) — keep in sync.
const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be', 'youtube-nocookie.com', 'www.youtube-nocookie.com']
const VIMEO_HOSTS = ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']
const FILE_RE = /\.(mp4|webm|ogg|mov)$/i

/** @returns {{kind:'youtube',id:string}|{kind:'vimeo',embedUrl:string}|{kind:'file',src:string}|null} */
export function parseVideoUrl(raw) {
  if (!raw) return null
  let url
  try { url = new URL(raw) } catch { return null }
  if (url.protocol !== 'https:' && !(import.meta.env.DEV && url.protocol === 'http:')) return null
  const host = url.hostname.toLowerCase()

  if (YOUTUBE_HOSTS.includes(host)) {
    let id
    if (host.endsWith('youtu.be')) id = url.pathname.slice(1).split('/')[0]
    else if (url.pathname === '/watch') id = url.searchParams.get('v')
    else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/)
      id = m && m[1]
    }
    return id && /^[\w-]{11}$/.test(id) ? { kind: 'youtube', id } : null
  }
  if (VIMEO_HOSTS.includes(host)) {
    const m = url.pathname.match(/(\d{5,})/)
    return m ? { kind: 'vimeo', embedUrl: `https://player.vimeo.com/video/${m[1]}` } : null
  }
  if (FILE_RE.test(url.pathname)) return { kind: 'file', src: url.toString() }
  return null
}

export const isTrackable = (parsed) => parsed?.kind === 'youtube' || parsed?.kind === 'file'
