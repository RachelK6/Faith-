import Logo from './Logo.jsx'

export default function AuthBrand() {
  return (
    <div className="auth-brand">
      <Logo mark height={64} />
      <div className="auth-brand-copy">
        <p className="auth-brand-title"><span>Optimum</span> <span>LMS</span></p>
        <p className="auth-brand-subtitle">Learning Platform</p>
      </div>
    </div>
  )
}