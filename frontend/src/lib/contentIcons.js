import {
  Award,
  Bell,
  BookOpen,
  ClipboardCheck,
  FileText,
  FlaskConical,
  FolderKanban,
  Layers,
  MessagesSquare,
  PlayCircle,
  TrendingUp,
} from 'lucide-react'

const icons = Object.freeze({
  video: PlayCircle,
  course: BookOpen,
  module: Layers,
  lab: FlaskConical,
  quiz: ClipboardCheck,
  assignment: FileText,
  certificate: Award,
  project: FolderKanban,
  discussion: MessagesSquare,
  notification: Bell,
  progress: TrendingUp,
})

const warnedTypes = new Set()

export function resolveContentIcon(type) {
  if (!type) return BookOpen
  const icon = icons[type]
  if (icon) return icon

  const key = String(type)
  if (!warnedTypes.has(key)) {
    console.warn(`Unknown LMS content icon type: ${key}`)
    warnedTypes.add(key)
  }
  return BookOpen
}