// src/pages/MemberMenu.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Header from './Header';
import './styles/MemberMenu.css';

export default function MemberMenu() {
    const { leagueId, userId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [member, setMember] = useState(null);   // { username, totalPoints, rank }
    const [league, setLeague] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { navigate('/login'); return; }
                setIsOwnProfile(user.id === userId);

                // Fetch league name
                const { data: leagueData, error: leagueErr } = await supabase
                    .from('leagues')
                    .select('id, name')
                    .eq('id', leagueId)
                    .single();
                if (leagueErr || !leagueData) {
                    setErrorMsg('League not found.');
                    setLoading(false);
                    return;
                }
                setLeague(leagueData);

                // Fetch all members ordered by points to derive rank
                const { data: members, error: membersErr } = await supabase
                    .from('league_members')
                    .select(`
                                    user_id,
                                    gs_points,
                                    ko_points,
                                    profiles ( username )
    `)
                    .eq('league_id', leagueId);

                if (membersErr) throw membersErr;

                const ranked = members
                    .map(m => ({ ...m, total_points: m.gs_points + m.ko_points }))
                    .sort((a, b) => b.total_points - a.total_points);

                const idx = ranked.findIndex(m => m.user_id === userId);
                if (idx === -1) {
                    setErrorMsg('Member not found in this league.');
                    setLoading(false);
                    return;
                }

                const m = ranked[idx];
                setMember({
                    username: m.profiles?.username || userId.slice(0, 8),
                    totalPoints: m.total_points,
                    rank: idx + 1,
                    total: ranked.length,
                });
            } catch (err) {
                console.error(err);
                setErrorMsg('Failed to load member.');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [leagueId, userId, navigate]);

    if (loading) {
        return (
            <div className="mm-page">
                <Header activeLink="leagues" />
                <main className="mm-main">
                    <div className="mm-shimmer mm-shimmer--title" />
                    <div className="mm-shimmer mm-shimmer--sub" />
                    <div className="mm-shimmer mm-shimmer--card" />
                    <div className="mm-shimmer mm-shimmer--card" />
                </main>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="mm-page">
                <Header activeLink="leagues" />
                <main className="mm-main">
                    <button className="mm-back" onClick={() => navigate(`/leagues/${leagueId}`)}>← Back to league</button>
                    <p className="mm-error">{errorMsg}</p>
                </main>
            </div>
        );
    }

    const rankLabel = (r) => {
        if (r === 1) return '🥇';
        if (r === 2) return '🥈';
        if (r === 3) return '🥉';
        return `#${r}`;
    };

    return (
        <div className="mm-page">
            <Header activeLink="leagues" />
            <main className="mm-main">
                <button className="mm-back" onClick={() => navigate(`/leagues/${leagueId}`)}>
                    ← {league?.name}
                </button>

                {/* Hero */}
                <div className="mm-hero">
                    <div className="mm-avatar">
                        {member.username.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="mm-hero-info">
                        <p className="mm-eyebrow">
                            {league?.name}
                            {isOwnProfile && <span className="mm-you-badge">You</span>}
                        </p>
                        <h1 className="mm-title">@{member.username}</h1>
                        <div className="mm-stats-row">
                            <div className="mm-stat">
                                <span className="mm-stat-num">{rankLabel(member.rank)}</span>
                                <span className="mm-stat-label">Rank</span>
                            </div>
                            <div className="mm-stat-divider" />
                            <div className="mm-stat">
                                <span className="mm-stat-num accent">{member.totalPoints}</span>
                                <span className="mm-stat-label">Points</span>
                            </div>
                            <div className="mm-stat-divider" />
                            <div className="mm-stat">
                                <span className="mm-stat-num muted">{member.rank}/{member.total}</span>
                                <span className="mm-stat-label">Position</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nav cards */}
                <p className="mm-section-label">Predictions</p>
                <div className="mm-cards">
                    <button
                        className="mm-card"
                        onClick={() => navigate(`/leagues/${leagueId}/members/${userId}/groupstage`)}
                    >
                        <span className="mm-card-icon">🌍</span>
                        <div className="mm-card-body">
                            <h2>Group Stage</h2>
                            <p>See predictions and points breakdown for all 12 groups.</p>
                        </div>
                        <span className="mm-card-arrow">→</span>
                    </button>

                    <button
                        className="mm-card"
                        onClick={() => navigate(`/leagues/${leagueId}/members/${userId}/knockout`)}
                    >
                        <span className="mm-card-icon">⚔️</span>
                        <div className="mm-card-body">
                            <h2>Knockout Rounds</h2>
                            <p>See predictions and points breakdown for every knockout match.</p>
                        </div>
                        <span className="mm-card-arrow">→</span>
                    </button>
                </div>
            </main>
        </div>
    );
}