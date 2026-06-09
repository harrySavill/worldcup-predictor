// src/pages/Login.jsx
import { Link, useNavigate } from 'react-router-dom'
import './styles/Login.css'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
    const [email, setEmail]         = useState('')
    const [password, setPassword]   = useState('')
    const [loading, setLoading]     = useState(false)
    const [errorMsg, setErrorMsg]   = useState(null)

    const navigate = useNavigate()

    const signInWithGoogle = async () => {
        setLoading(true);
        setErrorMsg(null);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,  // same as email login
            },
        });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
        }
        // Supabase redirects automatically → no navigate needed here
    };

    async function handleLogin(e) {
        e.preventDefault()
        setLoading(true)
        setErrorMsg(null)

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setErrorMsg(error.message)
            setLoading(false)
            return
        }

        // Success
        navigate('/dashboard')
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>Welcome back</h1>
                </div>

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Email address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn primary large"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Log in'}
                    </button>

                    {errorMsg && (
                        <p style={{ color: 'red', marginTop: '1rem' }}>{errorMsg}</p>
                    )}

                    <div className="forgot-password">
                        <Link to="/forgotPassword" className="link-accent">
                            Forgot password?
                        </Link>
                    </div>
                </form>
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button type="button" onClick={signInWithGoogle} className="btn-google" disabled={loading}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google"/>
                        Sign in with Google
                    </button>
                </div>
                <div className="login-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/register" className="link-accent">
                            Sign up
                        </Link>
                    </p>
                    <Link to="/" className="back-link">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    )
}