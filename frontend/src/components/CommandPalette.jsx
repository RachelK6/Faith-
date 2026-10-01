import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, Code2, Award, Users, Shield, Play, X } from 'lucide-react'

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose()
        else window.dispatchEvent(new CustomEvent('open-command-palette'))
      }
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const items = [
    { label: 'Resume Lesson: DOM Manipulation', category: 'Lesson', icon: Play, action: () => navigate('/dashboard/student') },
    { label: 'My Enrolled Courses', category: 'Navigation', icon: BookOpen, action: () => navigate('/dashboard/student/courses') },
    { label: 'Grades & Academic Feedback', category: 'Navigation', icon: Award, action: () => navigate('/dashboard/student/grades') },
    { label: 'Switch to Instructor Dashboard', category: 'Role', icon: Users, action: () => navigate('/dashboard/instructor') },
    { label: 'Switch to Admin Platform Overview', category: 'Role', icon: Shield, action: () => navigate('/dashboard/admin') },
    { label: 'Daily Lab: JavaScript Interactivity', category: 'Lab', icon: Code2, action: () => navigate('/dashboard/student') },
  ]

  const filtered = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()) || i.category.toLowerCase().includes(query.toLowerCase()))
    : items

  return (
    <div className="dg-modal-backdrop dg-on">
      <div className="dg-modal w-[92%]! max-w-xl! p-4!">
        {/* Search Input */}
        <div className="relative flex items-center border-b border-slate-700/80 pb-3">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search courses, labs, roles..."
            className="w-full bg-transparent pl-3 pr-8 text-sm text-white placeholder-slate-400 outline-none"
          />
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No results found for "{query}"</div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    item.action()
                    onClose()
                  }}
                  className="dg-cmd"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-300">
                    <Icon size={14} />
                  </span>
                  <span className="flex-1 text-xs font-semibold text-slate-200">{item.label}</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                    {item.category}
                  </span>
                </button>
              )
            })
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-700/80 pt-2.5 text-[11px] text-slate-400">
          <span>Navigate with search</span>
          <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px]">ESC to close</kbd>
        </div>
      </div>
    </div>
  )
}
