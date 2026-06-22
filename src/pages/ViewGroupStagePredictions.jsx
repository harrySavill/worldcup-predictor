// src/pages/ViewGroupStagePredictions.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Header from './Header';
import './styles/ViewGroupStagePredictions.css';
import { FLAGS } from "../lib/flags.js";

// 2026 FIFA World Cup groups — same source of truth as the predictions page
const GROUPS_DATA = {
    A: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
    B: ['Canada', 'Bosnia & Herzegovina', 'Qatar', 'Switzerland'],
    C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
    D: ['USA', 'Paraguay', 'Australia', 'Turkey'],
    E: ['Germany', 'Curacao', 'Ivory Coast', 'Ecuador'],
    F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
    G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
    H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
    I: ['France', 'Senegal', 'Iraq', 'Norway'],
    J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
    K: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
    L: ['England', 'Croatia', 'Ghana', 'Panama'],
};

const TOTAL_THIRDS = 8;
const positionLabels = ['1st', '2nd', '3rd', '4th'];
const positionColors = ['var(--qual-first)', 'var(--qual-second)',  'var(--qual-out)'];

function ViewGroupCard({ groupLetter, teams, selectedThirds }) {
    return (
        <div className="vgsp-group-card">
            <div className="vgsp-group-header">
                <span className="vgsp-group-letter">Group {groupLetter}</span>
                <div className="vgsp-group-legend">
                    <span className="legend-dot" style={{ background: 'var(--qual-first)' }} />
                    <span className="legend-text">R32</span>
                    <span className="legend-text">TBD</span>
                </div>
            </div>
            <ul className="vgsp-team-list">
                {teams.map((team, idx) => {
                    let statusClass = '';
                    let statusText = '';
                    let statusColor = positionColors[idx];

                    if (idx < 2) {
                        statusClass = 'qualifies';
                        statusText = 'Advances';
                    } else if (idx === 2) {
                        const isAdvancing = selectedThirds.includes(groupLetter);
                        statusClass = isAdvancing ? 'qualifies' : 'eliminated';
                        statusText = isAdvancing ? 'Advances' : 'Eliminated';
                        statusColor = isAdvancing ? positionColors[0] : positionColors[3];
                    } else {
                        statusClass = 'eliminated';
                        statusText = 'Eliminated';
                    }

                    return (
                        <li
                            key={team}
                            className={`vgsp-team-row ${statusClass}`}
                        >
                            <span className="vgsp-position-badge" style={{ color: statusColor }}>
                                {positionLabels[idx]}
                            </span>
                            <span className="vgsp-team-flag">{FLAGS[team] || '🏳'}</span>
                            <span className="vgsp-team-name">{team}</span>
                            <span className="vgsp-team-status" style={{ color: statusColor }}>
                                {statusText}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default function ViewGroupStagePredictions() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [username, setUsername] = useState(null);
    const [predictions, setPredictions] = useState(null);
    const [selectedThirds, setSelectedThirds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                // Auth check
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { navigate('/login'); return; }
                setIsOwnProfile(user.id === userId);

                // Fetch the profile for the username
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', userId)
                    .single();
                if (profileError || !profile) {
                    setErrorMsg('User not found.');
                    setLoading(false);
                    return;
                }
                setUsername(profile.username || userId.slice(0, 8));

                // Fetch their predictions
                const { data: rows, error: predError } = await supabase
                    .from('group_stage_predictions')
                    .select('group_id, team_id, predicted_position, is_third_place_progressor')
                    .eq('user_id', userId)
                    .order('group_id', { ascending: true })
                    .order('predicted_position', { ascending: true });
                if (predError) throw predError;

                if (!rows || rows.length === 0) {
                    // User exists but has no predictions yet
                    setPredictions({});
                    setLoading(false);
                    return;
                }

                // Reconstruct predictions map
                const loaded = {};
                const thirds = [];
                rows.forEach(row => {
                    if (!loaded[row.group_id]) loaded[row.group_id] = [];
                    loaded[row.group_id][row.predicted_position - 1] = row.team_id;
                    if (row.is_third_place_progressor) thirds.push(row.group_id);
                });

                // Fill any missing groups with default order
                Object.keys(GROUPS_DATA).forEach(group => {
                    if (!loaded[group]) loaded[group] = [...GROUPS_DATA[group]];
                });

                setPredictions(loaded);
                setSelectedThirds(thirds);
            } catch (err) {
                console.error(err);
                setErrorMsg('Failed to load predictions.');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [userId, navigate]);

    // ── Loading ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="vgsp-page">
                <Header activeLink="leagues" />
                <main className="vgsp-main">
                    <div className="vgsp-loading">
                        <div className="vgsp-shimmer vgsp-shimmer--title" />
                        <div className="vgsp-shimmer vgsp-shimmer--sub" />
                        <div className="vgsp-groups-grid">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="vgsp-shimmer vgsp-shimmer--card" />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────────────────
    if (errorMsg) {
        return (
            <div className="vgsp-page">
                <Header activeLink="leagues" />
                <main className="vgsp-main">
                    <div className="vgsp-error">
                        <p>{errorMsg}</p>
                        <button className="vgsp-back-btn" onClick={() => navigate(-1)}>← Go back</button>
                    </div>
                </main>
            </div>
        );
    }

    // ── No predictions yet ───────────────────────────────────────────
    const hasPredictions = predictions && Object.keys(predictions).length > 0 &&
        Object.values(predictions).some(teams => teams.length > 0);

    if (!hasPredictions) {
        return (
            <div className="vgsp-page">
                <Header activeLink="leagues" />
                <main className="vgsp-main">
                    <button className="vgsp-back-btn" onClick={() => navigate(-1)}>← Back</button>
                    <div className="vgsp-empty">
                        <div className="vgsp-empty-icon">🎯</div>
                        <h2>No predictions yet</h2>
                        <p>@{username} hasn't submitted their group stage predictions.</p>
                        {isOwnProfile && (
                            <button
                                className="btn primary"
                                onClick={() => navigate('/GroupStagePredictions')}
                            >
                                Make your predictions
                            </button>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    const thirdsCount = selectedThirds.length;
    const advancingCount = Object.keys(predictions).length * 2 + thirdsCount;

    return (
        <div className="vgsp-page">
            <Header activeLink="leagues" />
            <main className="vgsp-main">
                {/* Back */}
                <button className="vgsp-back-btn" onClick={() => navigate(-1)}>← Back</button>

                {/* Hero */}
                <div className="vgsp-hero">
                    <div className="vgsp-hero-left">
                        <p className="vgsp-eyebrow">2026 FIFA World Cup</p>
                        <h1 className="vgsp-title">
                            <span className="vgsp-username">@{username}</span>
                            {isOwnProfile
                                ? <>'s predictions</>
                                : <>'s group stage predictions</>
                            }
                        </h1>
                    </div>
                    {isOwnProfile && (
                        <button
                            className="vgsp-edit-btn"
                            onClick={() => navigate('/GroupStagePredictions')}
                        >
                            Edit predictions
                        </button>
                    )}
                </div>

                {/* Stats row */}
                <div className="vgsp-stats-row">
                    <div className="vgsp-stat">
                        <span className="vgsp-stat-num">{Object.keys(predictions).length}</span>
                        <span className="vgsp-stat-label">Groups</span>
                    </div>
                    <div className="vgsp-stat">
                        <span
                            className="vgsp-stat-num"
                            style={{ color: thirdsCount === TOTAL_THIRDS ? 'var(--accent)' : 'var(--text-muted)' }}
                        >
                            {thirdsCount}/{TOTAL_THIRDS}
                        </span>
                        <span className="vgsp-stat-label">Thirds chosen</span>
                    </div>
                    <div className="vgsp-stat">
                        <span className="vgsp-stat-num">{advancingCount}</span>
                        <span className="vgsp-stat-label">Teams advancing</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="vgsp-legend-bar">
                    <span><span className="legend-pip" style={{ background: 'var(--qual-first)' }}></span>Qualifies (1st/2nd)</span>
                    <span><span className="legend-pip" style={{ background: 'var(--qual-out)' }}></span>Eliminated</span>
                </div>

                {/* Groups grid */}
                <div className="vgsp-groups-grid">
                    {Object.entries(GROUPS_DATA).map(([letter]) => (
                        <ViewGroupCard
                            key={letter}
                            groupLetter={letter}
                            teams={predictions[letter] || GROUPS_DATA[letter]}
                            selectedThirds={selectedThirds}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}