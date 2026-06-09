// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './styles/Dashboard.css'

export default function Dashboard() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/login')
            } else {
                setUser(session.user)
                setLoading(false)
            }
        })

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) navigate('/login')
            else setUser(session.user)
        })

        return () => listener.subscription.unsubscribe()
    }, [navigate])

    async function handleSignOut() {
        await supabase.auth.signOut()
        navigate('/login')
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
            </div>
        )
    }

    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Predictor'

    return (
        <div className="dashboard-page">
            {/* Top nav */}
            <header className="dashboard-header">
                <div className="dashboard-header-inner">
                    <span className="dashboard-logo">⚽ Predictor</span>
                    <div className="dashboard-header-right">
                        <span className="dashboard-username">@{username}</span>
                        <button className="btn-signout" onClick={handleSignOut}>Sign out</button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                {/* Hero greeting */}
                <section className="dashboard-hero">
                    <p className="dashboard-eyebrow">Your hub</p>
                    <h1>Welcome back, <span className="accent-text">{username}</span></h1>
                    <p className="dashboard-subhead">
                        Predict results, join leagues, and chase the top of the table.
                    </p>
                </section>

                {/* Primary action cards */}
                <section className="dashboard-cards">
                    <Link to="/predictions" className="dash-card dash-card--primary">
                        <div className="dash-card-icon">🎯</div>
                        <div className="dash-card-body">
                            <h2>Make Predictions</h2>
                            <p>Pick your scores for upcoming fixtures before kick-off.</p>
                        </div>
                        <span className="dash-card-arrow">→</span>
                    </Link>

                    <Link to="/leagues/join" className="dash-card dash-card--secondary">
                        <div className="dash-card-icon">🏆</div>
                        <div className="dash-card-body">
                            <h2>Join a League</h2>
                            <p>Enter a code to compete with friends in a private league.</p>
                        </div>
                        <span className="dash-card-arrow">→</span>
                    </Link>

                    <Link to="/leagues/create" className="dash-card dash-card--secondary">
                        <div className="dash-card-icon">✨</div>
                        <div className="dash-card-body">
                            <h2>Create a League</h2>
                            <p>Start your own league and invite friends to compete.</p>
                        </div>
                        <span className="dash-card-arrow">→</span>
                    </Link>
                </section>

                {/* Quick stats row */}
                <section className="dashboard-stats">
                    <div className="stat-card">
                        <span className="stat-value">—</span>
                        <span className="stat-label">Predictions made</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">—</span>
                        <span className="stat-label">Leagues joined</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">—</span>
                        <span className="stat-label">Points total</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">—</span>
                        <span className="stat-label">Best rank</span>
                    </div>
                </section>

                {/* My leagues placeholder */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h3>My Leagues</h3>
                        <Link to="/leagues/join" className="link-accent">+ Join one</Link>
                    </div>
                    <div className="empty-state">
                        <span className="empty-icon">🏟️</span>
                        <p>You haven't joined any leagues yet.</p>
                        <Link to="/leagues/join" className="btn primary">Join a League</Link>
                    </div>
                </section>

                {/* Recent predictions placeholder */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h3>Recent Predictions</h3>
                        <Link to="/predictions" className="link-accent">View all</Link>
                    </div>
                    <div className="empty-state">
                        <span className="empty-icon">📋</span>
                        <p>No predictions submitted yet. Fixtures are waiting.</p>
                        <Link to="/predictions" className="btn primary">Make Predictions</Link>
                    </div>
                </section>
            </main>
        </div>
    )
}

