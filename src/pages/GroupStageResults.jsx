// src/pages/GroupStageResults.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Header from './Header';
import { FLAGS } from '../lib/flags.js';
import './styles/GroupStageResults.css';

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

const POSITION_LABELS = ['1st', '2nd', '3rd', '4th'];

// ── Points breakdown helpers ────────────────────────────────────────
// Derive the bonus type from points_awarded on the position-1 row
function getGroupBonus(pos1Points) {
    if (pos1Points === null || pos1Points === undefined) return null;
    if (pos1Points >= 13) return { label: 'Perfect group!', detail: '+10 bonus', pts: pos1Points, tier: 'perfect' };
    if (pos1Points >= 8)  return { label: 'Top 2 in order', detail: '+5 bonus', pts: pos1Points, tier: 'order' };
    if (pos1Points >= 6)  return { label: 'Top 2 identified', detail: '+3 bonus', pts: pos1Points, tier: 'partial' };
    if (pos1Points === 3) return { label: 'Position correct', detail: null, pts: pos1Points, tier: 'base' };
    if (pos1Points === 0) return { label: 'No points', detail: null, pts: 0, tier: 'none' };
    return null;
}

// Total points for a group (sum of all 4 rows)
function groupTotal(rows) {
    return rows.reduce((sum, r) => sum + (r.points_awarded ?? 0), 0);
}

// ── Individual team row ─────────────────────────────────────────────
function TeamResultRow({ row, position }) {
    const { team_id, predicted_position, is_third_place_progressor: predProgressor,
        points_awarded, actual_position, actual_progressor } = row;

    const groupComplete = actual_position !== null && actual_position !== undefined;
    const posCorrect = groupComplete && actual_position === predicted_position;
    const isThird = predicted_position === 3;

    // Work out display state
    let rowClass = 'gsr-team-row';
    let indicator = null;

    if (groupComplete) {
        if (posCorrect) {
            rowClass += ' gsr-team-row--correct';
            indicator = '✓';
        } else {
            rowClass += ' gsr-team-row--wrong';
            indicator = '✗';
        }
    }

    // Third-place progressor note
    let progressorNote = null;
    if (isThird && groupComplete) {
        if (predProgressor && actual_progressor) {
            progressorNote = { text: 'Progressor picked correctly +2', ok: true };
        } else if (predProgressor && !actual_progressor) {
            progressorNote = { text: 'Picked to progress - incorrect', ok: false };
        } else if (!predProgressor && actual_progressor) {
            progressorNote = { text: 'Progressed - not picked', ok: false };
        }
    }

    const pts = points_awarded ?? null;

    return (
        <li className={rowClass}>
            <span className="gsr-pos-badge">{POSITION_LABELS[position]}</span>
            <span className="gsr-flag">{FLAGS[team_id] || '🏳'}</span>
            <span className="gsr-team-name">{team_id}</span>

            {groupComplete && actual_position !== null && (
                <span className="gsr-actual">
                    Actual: {POSITION_LABELS[actual_position - 1]}
                </span>
            )}

            {groupComplete && indicator && (
                <span className={`gsr-indicator ${posCorrect ? 'gsr-indicator--correct' : 'gsr-indicator--wrong'}`}>
                    {indicator}
                </span>
            )}

            {groupComplete && pts !== null && (
                <span className={`gsr-pts ${pts > 0 ? 'gsr-pts--positive' : 'gsr-pts--zero'}`}>
                    {pts > 0 ? `+${pts}` : '0'}
                </span>
            )}

            {progressorNote && (
                <span className={`gsr-progressor-note ${progressorNote.ok ? 'gsr-progressor-note--ok' : 'gsr-progressor-note--miss'}`}>
                    {progressorNote.text}
                </span>
            )}
        </li>
    );
}

// ── Group card ──────────────────────────────────────────────────────
function GroupResultCard({ groupLetter, rows }) {
    const groupComplete = rows.some(r => r.actual_position !== null && r.actual_position !== undefined);
    const total = groupTotal(rows);
    const pos1Row = rows.find(r => r.predicted_position === 1);
    const bonus = groupComplete ? getGroupBonus(pos1Row?.points_awarded) : null;

    // Sort rows by predicted_position for display
    const sorted = [...rows].sort((a, b) => a.predicted_position - b.predicted_position);

    return (
        <div className={`gsr-group-card ${!groupComplete ? 'gsr-group-card--pending' : ''}`}>
            <div className="gsr-group-header">
                <span className="gsr-group-letter">Group {groupLetter}</span>
                <div className="gsr-group-right">
                    {!groupComplete && (
                        <span className="gsr-pending-badge">Pending</span>
                    )}
                    {groupComplete && (
                        <span className="gsr-group-total">
                            {total} <span className="gsr-pts-label">pts</span>
                        </span>
                    )}
                </div>
            </div>

            <ul className="gsr-team-list">
                {sorted.map((row, idx) => (
                    <TeamResultRow
                        key={row.team_id}
                        row={row}
                        position={idx}
                    />
                ))}
            </ul>

            {groupComplete && bonus && bonus.tier !== 'base' && bonus.tier !== 'none' && (
                <div className={`gsr-bonus-bar gsr-bonus-bar--${bonus.tier}`}>
                    <span className="gsr-bonus-label">{bonus.label}</span>
                    {bonus.detail && <span className="gsr-bonus-detail">{bonus.detail}</span>}
                </div>
            )}
        </div>
    );
}

// ── Main page ───────────────────────────────────────────────────────
export default function GroupStageResults() {
    const { leagueId, userId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [username, setUsername] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [groupData, setGroupData] = useState({});   // { A: [rows], B: [rows], ... }
    const [totalPoints, setTotalPoints] = useState(0);
    const [groupsScored, setGroupsScored] = useState(0);
    const [hasPredictions, setHasPredictions] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { navigate('/login'); return; }

                // Resolve which user we're viewing
                const targetId = userId || user.id;
                setIsOwnProfile(user.id === targetId);

                // Fetch username
                const { data: profile, error: profileErr } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', targetId)
                    .single();
                if (profileErr || !profile) {
                    setErrorMsg('User not found.');
                    setLoading(false);
                    return;
                }
                setUsername(profile.username || targetId.slice(0, 8));

                // Fetch predictions and actual positions in parallel
                const [
                    { data: rows, error: rowsErr },
                    { data: positions, error: posErr },
                ] = await Promise.all([
                    supabase
                        .from('group_stage_predictions')
                        .select('group_id, team_id, predicted_position, is_third_place_progressor, points_awarded')
                        .eq('user_id', targetId)
                        .order('group_id', { ascending: true })
                        .order('predicted_position', { ascending: true }),
                    supabase
                        .from('group_stage_positions')
                        .select('team_id, position, is_third_place_progressor'),
                ]);

                if (rowsErr) throw rowsErr;
                if (posErr) throw posErr;

                if (!rows || rows.length === 0) {
                    setHasPredictions(false);
                    setLoading(false);
                    return;
                }

                setHasPredictions(true);

                // Build a lookup map for actual positions keyed by team_id
                const posMap = {};
                (positions || []).forEach(p => {
                    posMap[p.team_id] = {
                        actual_position: p.position,
                        actual_progressor: p.is_third_place_progressor,
                    };
                });

                // Build grouped structure, merging in actuals from the map
                const grouped = {};
                rows.forEach(r => {
                    const actual = posMap[r.team_id] || { actual_position: null, actual_progressor: null };
                    const flat = {
                        team_id: r.team_id,
                        predicted_position: r.predicted_position,
                        is_third_place_progressor: r.is_third_place_progressor,
                        points_awarded: r.points_awarded,
                        actual_position: actual.actual_position ?? null,
                        actual_progressor: actual.actual_progressor ?? null,
                    };
                    if (!grouped[r.group_id]) grouped[r.group_id] = [];
                    grouped[r.group_id].push(flat);
                });

                setGroupData(grouped);

                // Compute totals
                let pts = 0;
                let scored = 0;
                Object.values(grouped).forEach(groupRows => {
                    const complete = groupRows.some(r => r.actual_position !== null);
                    if (complete) {
                        scored++;
                        pts += groupTotal(groupRows);
                    }
                });
                setTotalPoints(pts);
                setGroupsScored(scored);

            } catch (err) {
                console.error(err);
                setErrorMsg('Failed to load results.');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [leagueId, userId, navigate]);

    // ── Loading ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="gsr-page">
                <Header activeLink="leagues" />
                <main className="gsr-main">
                    <div className="gsr-shimmer gsr-shimmer--title" />
                    <div className="gsr-shimmer gsr-shimmer--sub" />
                    <div className="gsr-groups-grid">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="gsr-shimmer gsr-shimmer--card" />
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    // ── Error ───────────────────────────────────────────────────────
    if (errorMsg) {
        return (
            <div className="gsr-page">
                <Header activeLink="leagues" />
                <main className="gsr-main">
                    <button className="gsr-back" onClick={() => navigate(-1)}>← Back</button>
                    <p className="gsr-error">{errorMsg}</p>
                </main>
            </div>
        );
    }

    // ── No predictions ──────────────────────────────────────────────
    if (!hasPredictions) {
        return (
            <div className="gsr-page">
                <Header activeLink="leagues" />
                <main className="gsr-main">
                    <button className="gsr-back" onClick={() => navigate(-1)}>← Back</button>
                    <div className="gsr-empty">
                        <span className="gsr-empty-icon">🎯</span>
                        <h2>No predictions submitted</h2>
                        <p>@{username} hasn't submitted their group stage predictions.</p>
                        {isOwnProfile && (
                            <button
                                className="btn primary"
                                onClick={() => navigate('/GroupStagePredictions')}
                            >
                                Make predictions
                            </button>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    const groupLetters = Object.keys(GROUPS_DATA);
    const totalGroups = groupLetters.length;
    const groupsPending = totalGroups - groupsScored;

    // Build back URL — go to member menu if leagueId present, else predictions menu
    const backPath = leagueId && userId
        ? `/leagues/${leagueId}/members/${userId}`
        : '/predictionsMenu';
    const backLabel = leagueId && userId ? `← @${username}` : '← Predictions';

    return (
        <div className="gsr-page">
            <Header activeLink="leagues" />
            <main className="gsr-main">
                <button className="gsr-back" onClick={() => navigate(backPath)}>
                    {backLabel}
                </button>

                {/* Hero */}
                <div className="gsr-hero">
                    <div className="gsr-hero-left">
                        <p className="gsr-eyebrow">2026 FIFA World Cup · Group Stage</p>
                        <h1 className="gsr-title">
                            <span className="gsr-username">@{username}</span>'s results
                        </h1>
                    </div>
                    {isOwnProfile && (
                        <button
                            className="gsr-edit-btn"
                            onClick={() => navigate('/GroupStagePredictions')}
                        >
                            Edit predictions
                        </button>
                    )}
                </div>

                {/* Summary stats */}
                <div className="gsr-summary">
                    <div className="gsr-summary-stat">
                        <span className="gsr-summary-num accent">{totalPoints}</span>
                        <span className="gsr-summary-label">Points earned</span>
                    </div>
                    <div className="gsr-summary-divider" />
                    <div className="gsr-summary-stat">
                        <span className="gsr-summary-num">{groupsScored}</span>
                        <span className="gsr-summary-label">Groups scored</span>
                    </div>
                    <div className="gsr-summary-divider" />
                    <div className="gsr-summary-stat">
                        <span className="gsr-summary-num muted">{groupsPending}</span>
                        <span className="gsr-summary-label">Pending</span>
                    </div>
                </div>

                {/* Scoring legend */}
                <div className="gsr-legend">
                    <span className="gsr-legend-item">
                        <span className="gsr-legend-pip gsr-legend-pip--correct" />
                        Correct position (+3 pts)
                    </span>
                    <span className="gsr-legend-item">
                        <span className="gsr-legend-pip gsr-legend-pip--wrong" />
                        Wrong position
                    </span>
                    <span className="gsr-legend-item gsr-legend-bonus">
                        ✦ Bonuses: Top 2 identified +3 · Top 2 in order +5 · Perfect group +10
                    </span>
                </div>

                {/* Groups grid */}
                <div className="gsr-groups-grid">
                    {groupLetters.map(letter => {
                        const rows = groupData[letter];
                        if (!rows) {
                            // No predictions for this group — use defaults
                            const defaultRows = GROUPS_DATA[letter].map((team, idx) => ({
                                team_id: team,
                                predicted_position: idx + 1,
                                is_third_place_progressor: false,
                                points_awarded: null,
                                actual_position: null,
                                actual_progressor: null,
                            }));
                            return (
                                <GroupResultCard
                                    key={letter}
                                    groupLetter={letter}
                                    rows={defaultRows}
                                />
                            );
                        }
                        return (
                            <GroupResultCard
                                key={letter}
                                groupLetter={letter}
                                rows={rows}
                            />
                        );
                    })}
                </div>
            </main>
        </div>
    );
}