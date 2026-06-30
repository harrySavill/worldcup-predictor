// src/pages/LeagueDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Header from './Header';
import './styles/LeagueDetail.css';

export default function LeagueDetail() {
    const { leagueId } = useParams();
    const navigate = useNavigate();

    const [league, setLeague]       = useState(null);
    const [members, setMembers]     = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading]     = useState(true);
    const [errorMsg, setErrorMsg]   = useState(null);
    const [copied, setCopied]       = useState(false);

    useEffect(() => {
        async function fetchLeagueData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { navigate('/login'); return; }
                setCurrentUser(user);

                // Fetch league info
                const { data: leagueData, error: leagueError } = await supabase
                    .from('leagues')
                    .select('id, name, invite_code, owner_id, created_at')
                    .eq('id', leagueId)
                    .single();

                if (leagueError || !leagueData) {
                    setErrorMsg('League not found.');
                    setLoading(false);
                    return;
                }

                // Fetch members with profile usernames
                const { data: membersData, error: membersError } = await supabase
                    .from('league_members')
                    .select(`
                                    user_id,
                                    gs_points,
                                    ko_points,
                                    joined_at,
                                    profiles (
                                        id,
                                        username
                                    )
    `)
                    .eq('league_id', leagueId)
                    .order('gs_points', { ascending: false }); // see note below

                if (membersError) throw membersError;

                setLeague(leagueData);
                setMembers(
                    (membersData || [])
                        .map(m => ({ ...m, total_points: m.gs_points + m.ko_points }))
                        .sort((a, b) => b.total_points - a.total_points)
                );
            } catch (err) {
                console.error(err);
                setErrorMsg('Failed to load league.');
            } finally {
                setLoading(false);
            }
        }

        fetchLeagueData();
    }, [leagueId, navigate]);

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(league.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback — select the text manually
        }
    };

    if (loading) {
        return (
            <div className="ld-page">
                <Header activeLink="leagues" />
                <main className="ld-main">
                    <div className="ld-loading">
                        <div className="loading-shimmer ld-shimmer-title" />
                        <div className="loading-shimmer ld-shimmer-sub" />
                        <div className="ld-shimmer-rows">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="loading-shimmer ld-shimmer-row" />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="ld-page">
                <Header activeLink="leagues" />
                <main className="ld-main">
                    <div className="ld-error">
                        <p>{errorMsg}</p>
                        <button className="btn secondary" onClick={() => navigate('/leagues')}>
                            ← Back to leagues
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    const isOwner = currentUser?.id === league.owner_id;
    const topPoints = members[0]?.total_points ?? 0;

    // Position label helper
    const getPositionLabel = (idx) => {
        if (idx === 0) return { label: '🥇', cls: 'pos-gold' };
        if (idx === 1) return { label: '🥈', cls: 'pos-silver' };
        if (idx === 2) return { label: '🥉', cls: 'pos-bronze' };
        return { label: `${idx + 1}`, cls: 'pos-num' };
    };

    return (
        <div className="ld-page">
            <Header activeLink="leagues" />

            <main className="ld-main">
                {/* Back link */}
                <button className="ld-back" onClick={() => navigate('/leagues')}>
                    ← All leagues
                </button>

                {/* League header */}
                <div className="ld-hero">
                    <div className="ld-hero-left">
                        <p className="ld-eyebrow">
                            {members.length} {members.length === 1 ? 'member' : 'members'}
                            {isOwner && <span className="ld-owner-badge">Your league</span>}
                        </p>
                        <h1 className="ld-title">{league.name}</h1>
                    </div>

                    <button
                        className={`ld-invite-btn ${copied ? 'copied' : ''}`}
                        onClick={handleCopyCode}
                        title="Copy invite code"
                    >
                        <span className="ld-invite-code">{league.invite_code}</span>
                        <span className="ld-invite-action">
                            {copied ? '✓ Copied' : 'Copy code'}
                        </span>
                    </button>
                </div>

                {/* Leaderboard */}
                {members.length === 0 ? (
                    <div className="ld-empty">
                        <div className="ld-empty-icon">🏟️</div>
                        <p>No members yet. Share the invite code to get started.</p>
                    </div>
                ) : (
                    <div className="ld-leaderboard">
                        <div className="ld-leaderboard-header">
                            <span className="ldh-rank">#</span>
                            <span className="ldh-name">Player</span>
                            <span className="ldh-pts">Points</span>
                        </div>

                        <ul className="ld-member-list">
                            {members.map((member, idx) => {
                                const username = member.profiles?.username
                                    || member.user_id.slice(0, 8);
                                const isCurrentUser = member.user_id === currentUser?.id;
                                const { label, cls } = getPositionLabel(idx);
                                const barWidth = topPoints > 0
                                    ? Math.max(4, Math.round((member.total_points / topPoints) * 100))
                                    : 0;

                                return (
                                    <li key={member.user_id}>
                                        <button
                                            className={`ld-member-row ${isCurrentUser ? 'ld-member-row--you' : ''}`}
                                            onClick={() => navigate(`/leagues/${leagueId}/members/${member.user_id}`)}
                                        >
                                            <span className={`ld-rank ${cls}`}>{label}</span>

                                            <span className="ld-member-info">
                                                <span className="ld-member-name">
                                                    @{username}
                                                    {isCurrentUser && <span className="ld-you-tag">you</span>}
                                                </span>
                                                <span className="ld-bar-wrap">
                                                    <span
                                                        className="ld-bar"
                                                        style={{ width: `${barWidth}%` }}
                                                    />
                                                </span>
                                            </span>

                                            <span className="ld-points">
                                                {member.total_points}
                                                <span className="ld-pts-label">pts</span>
                                            </span>

                                            <span className="ld-chevron">›</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </main>
        </div>
    );
}