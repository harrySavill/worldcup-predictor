import { Link } from 'react-router-dom'
import { useState } from 'react'
import './styles/ForgotPassword.css'
import { supabase } from '../lib/supabaseClient'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [errorMsg, setErrorMsg] = useState(null)



    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setMessage(null)
        setErrorMsg(null)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: "http://localhost:5173/update-password",
        })

        setLoading(false)

        if (error) {
            setErrorMsg(error.message)
            return
        }

        setMessage('If an account exists, a reset link has been sent. Check your email.')
    }

    return (
        <div className="forgot-password-page">
            <div className="forgot-password-container">
                <div className="forgot-password-header">
                    <h1>Reset password</h1>
                </div>

                <form className="forgot-password-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn primary large"
                        disabled={loading || !email.trim()}
                    >
                        {loading ? 'Sending…' : 'Send reset link'}
                    </button>

                    {errorMsg && (
                        <p style={{ color: '#ff6347', marginTop: '1rem' }}>{errorMsg}</p>
                    )}
                    {message && (
                        <p style={{ color: 'var(--accent)', marginTop: '1rem' }}>{message}</p>
                    )}

                    <div className="back-link-wrapper">
                        <Link to="/login" className="back-link">
                            ← Back to login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}