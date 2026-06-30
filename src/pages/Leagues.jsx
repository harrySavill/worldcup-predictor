// src/pages/Leagues.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Header from './Header';
import './styles/Leagues.css';

export default function Leagues() {
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        async function fetchLeagues() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    navigate('/login');
                    return;
                }

                const { data, error } = await supabase
                    .from('league_members')
                    .select(`
                                    league_id,
                                    gs_points,
                                    ko_points,
                                    joined_at,
                                    leagues (
                                        id,
                                        name,
                                        owner_id,
                                        created_at
                                    )
    `)
                    .eq('user_id', user.id)
                    .order('joined_at', { ascending: false });

                if (error) throw error;

                // Fetch member counts separately
                const leagueIds = data.map(d => d.league_id);
                let memberCounts = {};

                if (leagueIds.length > 0) {
                    const { data: counts } = await supabase
                        .from('league_members')
                        .select('league_id')
                        .in('league_id', leagueIds);

                    if (counts) {
                        counts.forEach(({ league_id }) => {
                            memberCounts[league_id] = (memberCounts[league_id] || 0) + 1;
                        });
                    }
                }

                setLeagues(
                    data.map(d => ({
                        ...d.leagues,
                        total_points: d.gs_points + d.ko_points,
                        joined_at: d.joined_at,
                        member_count: memberCounts[d.league_id] || 1,
                    }))
                );
            } catch (err) {
                console.error(err);
                setErrorMsg('Failed to load your leagues.');
            } finally {
                setLoading(false);
            }
        }

        fetchLeagues();
    }, [navigate]);

    return (
        <div className="leagues-page">
            <Header activeLink="leagues" />

            <main className="leagues-main">
                <div className="leagues-container">

                    <div className="leagues-header">
                        <h1>Your Leagues</h1>
                        <div className="leagues-actions">
                            <button
                                className="btn secondary"
                                onClick={() => navigate('/leagues/join')}
                            >
                                Join a league
                            </button>
                            <button
                                className="btn primary"
                                onClick={() => navigate('/leagues/create')}
                            >
                                + Create league
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <div className="leagues-loading">
                            <div className="loading-shimmer" />
                            <div className="loading-shimmer" />
                            <div className="loading-shimmer" />
                        </div>
                    )}

                    {errorMsg && !loading && (
                        <p className="error-message">{errorMsg}</p>
                    )}

                    {!loading && !errorMsg && leagues.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">🏟️</div>
                            <h2>No leagues yet</h2>
                            <p>Create your own or join one with an invite code.</p>
                            <div className="empty-actions">
                                <button
                                    className="btn primary large"
                                    onClick={() => navigate('/leagues/create')}
                                >
                                    Create a league
                                </button>
                                <button
                                    className="btn secondary large"
                                    onClick={() => navigate('/leagues/join')}
                                >
                                    Join with a code
                                </button>
                            </div>
                        </div>
                    )}

                    {!loading && leagues.length > 0 && (
                        <ul className="leagues-list">
                            {leagues.map(league => (
                                <li key={league.id}>
                                    <button
                                        className="league-card"
                                        onClick={() => navigate(`/leagues/${league.id}`)}
                                    >
                                        <div className="league-card-main">
                                            <span className="league-name">{league.name}</span>
                                            <span className="league-meta">
                                                {league.member_count} {league.member_count === 1 ? 'member' : 'members'}
                                            </span>
                                        </div>
                                        <div className="league-card-right">
                                            <span className="league-points">
                                                {league.total_points} <span className="pts-label">pts</span>
                                            </span>
                                            <span className="league-chevron">›</span>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                </div>
            </main>
        </div>
    );
}