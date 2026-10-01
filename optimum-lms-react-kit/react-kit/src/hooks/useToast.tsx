import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Toast = { id: number; message: string }
type ToastCtx = { toast: (message: string) => void }

const Ctx = createContext<ToastCtx | null>(null)

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<(Toast & { bye?: boolean })[]>([])

  const toast = useCallback((message: string) => {
    const id = nextId++
    setToasts((t) => [...t, { id, message }])
    setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, bye: true } : x)))
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 400)
    }, 3200)
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="dg-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`dg-toast${t.bye ? ' dg-bye' : ''}`}>
            <i>
              <svg viewBox="0 0 24 24">
                <path d="M4 12l5 5L20 6" fill="none" />
              </svg>
            </i>
            <span>{t.message}</span>
            <b />
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx.toast
}
