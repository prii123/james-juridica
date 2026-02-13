'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credenciales inválidas')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center py-5 px-3">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="text-center mb-4">
              <div className="mx-auto bg-warning rounded-circle d-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                <svg style={{width: '32px', height: '32px'}} className="text-dark" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z" />
                </svg>
              </div>
              <h1 className="h2 text-light fw-bold mb-2">ERP Jurídico</h1>
              <p className="text-warning h5 fw-semibold">Procesos de Insolvencia</p>
            </div>
        
            <div className="card shadow">
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-bold">Correo Electrónico</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="form-control"
                      placeholder="ejemplo@firma.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-bold">Contraseña</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="form-control"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-100"
                  >
                    {loading ? 'Verificando...' : 'Acceder al Sistema'}
                  </button>
                </form>

                <div className="mt-3">
                  <h6 className="fw-bold">Credenciales de Prueba</h6>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">Admin: admin / admin123</li>
                    <li className="list-group-item">Admin: admin@juridica.com / admin123</li>
                    <li className="list-group-item">Abogado: abogado@juridica.com / abogado123</li>
                    <li className="list-group-item">Asesor: asesor@juridica.com / asesor123</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}