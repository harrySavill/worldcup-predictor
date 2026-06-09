// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './styles/Dashboard.css';
import Header from './Header';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/login');
            } else {
                setUser(session.user);
                setLoading(false);
            }
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) navigate('/login');
            else setUser(session.user);
        });

        return () => listener.subscription.unsubscribe();
    }, [navigate]);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
            </div>
        );
    }

    const username = user?.user_metadata?.username ||
        user?.email?.split('@')[0] ||
        'Predictor';

    return (
        <div className="dashboard-page">
            <Header activeLink="dashboard" />

            <main className="dashboard-main">
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
                    <Link to="/leagues" className="dash-card dash-card--secondary">
                        <div className="dash-card-icon">📋</div>
                        <div className="dash-card-body">
                            <h2>Your Leagues</h2>
                            <p>View the leagues you have already joined.</p>
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
                        <div className="dash-card-icon">➕</div>
                        <div className="dash-card-body">
                            <h2>Create a League</h2>
                            <p>Start your own league and invite friends to compete.</p>
                        </div>
                        <span className="dash-card-arrow">→</span>
                    </Link>
                </section>
            </main>
        </div>
    );
}