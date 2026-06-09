// src/pages/Register.jsx
import { Link, useNavigate } from 'react-router-dom'
import './styles/Register.css'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Register() {
    const [email, setEmail]             = useState('')
    const [password, setPassword]       = useState('')
    const [confirmedPassword, setConfirmedPassword] = useState('')
    const [username, setUsername]       = useState('')
    const [loading, setLoading]         = useState(false)
    const [errorMsg, setErrorMsg]       = useState(null)

    const navigate = useNavigate()

    const signInWithGoogle = async () => {
        setLoading(true);
        setErrorMsg(null);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
        }
    };

    async function handleSignUp(e) {
        e.preventDefault()
        setLoading(true)
        setErrorMsg(null)

        if (password !== confirmedPassword) {
            setErrorMsg("Passwords don't match")
            setLoading(false)
            return
        }

        if (username.length < 3) {
            setErrorMsg("Username must be at least 3 characters")
            setLoading(false)
            return
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        })

        if (error) {
            setErrorMsg(error.message)
            setLoading(false)
            return
        }

        setLoading(false)
        navigate('/login')
    }async function handleSignUp(e) {
        e.preventDefault()
        setLoading(true)
        setErrorMsg(null)

        if (password !== confirmedPassword) {
            setErrorMsg("Passwords don't match")
            setLoading(false)
            return
        }

        if (username.length < 3) {
            setErrorMsg("Username must be at least 3 characters")
            setLoading(false)
            return
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        })

        if (error) {
            setErrorMsg(error.message)
            setLoading(false)
            return
        }


        if (data.user && !data.session) {
            setErrorMsg('This email is already registered. Please log in.')
            setLoading(false)
            return
        }


        setLoading(false)

        if (data.session) {
            navigate('/dashboard')
        } else {
            setErrorMsg('Check your email to confirm your account')
        }
    }

    return (
        <div className="register-page">
            <div className="register-container">
                <div className="register-header">
                    <h1>Create your account</h1>
                </div>

                <form className="register-form" onSubmit={handleSignUp}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={e => setUsername(e.target.value.trim())}
                            placeholder="Choose a username"
                            required
                            minLength={3}
                            maxLength={20}
                        />
                    </div>

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
                            minLength={8}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirm-password">Confirm password</label>
                        <input
                            type="password"
                            id="confirm-password"
                            value={confirmedPassword}
                            onChange={e => setConfirmedPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn primary large" disabled={loading}>
                        {loading ? 'Signing up...' : 'Sign Up'}
                    </button>

                    {errorMsg && <p style={{ color: 'red', marginTop: '1rem' }}>{errorMsg}</p>}
                </form>
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button type="button" onClick={signInWithGoogle} className="btn-google" disabled={loading}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google"/>
                        Sign up with Google
                    </button>
                </div>
                <div className="register-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="link-accent">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}