import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './styles/UpdatePassword.css'

export default function UpdatePassword() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [errorMsg, setErrorMsg] = useState(null)

    const navigate = useNavigate()

    useEffect(() => {
        const { data: listener } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                console.log('User in password recovery mode')
            }
        })

        return () => listener.subscription.unsubscribe()
    }, [])

    async function handleUpdate(e) {
        e.preventDefault()
        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match')
            return
        }
        if (password.length < 6) {
            setErrorMsg('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        setErrorMsg(null)

        const { error } = await supabase.auth.updateUser({ password })

        setLoading(false)

        if (error) {
            setErrorMsg(error.message)
            return
        }

        setMessage('Password updated! Redirecting to login...')
        setTimeout(() => navigate('/login'), 2000)
    }

    return (
        <div className="update-password-page">
            <div className="update-password-container">
                <div className="update-password-header">
                    <h1>Set new password</h1>
                </div>

                <form className="update-password-form" onSubmit={handleUpdate}>
                    <div className="form-group">
                        <label htmlFor="password">New password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirm">Confirm password</label>
                        <input
                            type="password"
                            id="confirm"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn primary large"
                        disabled={loading || !password.trim()}
                    >
                        {loading ? 'Updating…' : 'Update password'}
                    </button>

                    {errorMsg && <p style={{ color: '#ff6347', marginTop: '1rem' }}>{errorMsg}</p>}
                    {message && <p style={{ color: 'var(--accent)', marginTop: '1rem' }}>{message}</p>}

                    <div className="back-link-wrapper">
                        <a href="/login" className="back-link">← Back to login</a>
                    </div>
                </form>
            </div>
        </div>
    )
}