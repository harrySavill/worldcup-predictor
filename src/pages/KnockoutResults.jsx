// src/pages/KnockoutResults.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Header from './Header';
import { FLAGS } from '../lib/flags.js';
import './styles/KnockoutResults.css';

const ROUND_META = {
    R32: { label: 'Round of 32',    short: 'R32', icon: '⚔️', basePoints: 5 },
    R16: { label: 'Round of 16',    short: 'R16', icon: '🎯', basePoints: 8 },
    QF:  { label: 'Quarter-Finals', short: 'QF',  icon: '🏅', basePoints: 12 },
    SF:  { label: 'Semi-Finals',    short: 'SF',  icon: '🔥', basePoints: 16 },
    F:   { label: 'Final',          short: 'F',   icon: '🏆', basePoints: 20 },
};
const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'F'];

// ── Breakdown calculator — mirrors the SQL scoring logic, for display only ──
function computeBreakdown(round, pred, match) {
    const items = [];
    const winnerCorrect = pred.predicted_winner === match.winner;
    const hasResult = match.winner !== null && match.winner !== undefined;

    if (!hasResult) return { items: [], total: null, pending: true };

    const base = ROUND_META[round]?.basePoints ?? 0;
    items.push({
        label: winnerCorrect ? 'Correct winner' : 'Incorrect winner',
        pts: winnerCorrect ? base : 0,
        ok: winnerCorrect,
    });

    // Scoreline bonus — independent of winner correctness
    if (pred.predicted_home_goals !== null && pred.predicted_away_goals !== null &&
        match.home_goals !== null && match.home_goals !== undefined) {
        const exact = pred.predicted_home_goals === match.home_goals &&
            pred.predicted_away_goals === match.away_goals;
        const gdMatch = (pred.predicted_home_goals - pred.predicted_away_goals) ===
            (match.home_goals - match.away_goals);

        if (exact) {
            items.push({ label: 'Exact scoreline', pts: 10, ok: true });
        } else if (gdMatch) {
            items.push({ label: 'Correct goal difference', pts: 5, ok: true });
        }
    }

    // ...rest unchanged

    const etCorrect = pred.predicted_extra_time === match.extra_time;
    items.push({
        label: etCorrect ? 'Correct extra time call' : 'Incorrect extra time call',
        pts: etCorrect ? 3 : -2,
        ok: etCorrect,
    });

    if (match.extra_time && etCorrect) {
        const penCorrect = pred.predicted_penalties === match.penalties;
        items.push({
            label: penCorrect ? 'Correct penalties call' : 'Incorrect penalties call',
            pts: penCorrect ? 5 : -2,
            ok: penCorrect,
        });

        if (match.penalties && penCorrect && winnerCorrect) {
            items.push({ label: 'Correct penalty winner', pts: 3, ok: true });
        }
    }

    const total = items.reduce((s, i) => s + i.pts, 0);
    return { items, total, pending: false };
}

// ── Single match row ─────────────────────────────────────────────
function MatchResult({ match, pred }) {
    const { home_team, away_team } = match;
    const { items, total, pending } = computeBreakdown(match.round, pred, match);

    return (
        <div className={`kr-match ${pending ? 'kr-match--pending' : ''}`}>
            <div className="kr-match-teams">
                <span className="kr-team">
                    <span className="kr-flag">{FLAGS[home_team] || '🏳'}</span>
                    {home_team}
                </span>
                <span className="kr-score">
                    {pending
                        ? <span className="kr-vs">vs</span>
                        : <span className="kr-actual-score">{match.home_goals ?? '–'} : {match.away_goals ?? '–'}</span>
                    }
                </span>
                <span className="kr-team kr-team--away">
                    {away_team}
                    <span className="kr-flag">{FLAGS[away_team] || '🏳'}</span>
                </span>
            </div>

            <div className="kr-pred-row">
                <span className="kr-pred-label">Your pick:</span>
                <span className="kr-pred-winner">{pred.predicted_winner}</span>
                {pred.predicted_home_goals !== null && pred.predicted_away_goals !== null && (
                    <span className="kr-pred-score">
                        ({pred.predicted_home_goals}–{pred.predicted_away_goals})
                    </span>
                )}
                {pred.predicted_extra_time && (
                    <span className="kr-pred-tag">AET{pred.predicted_penalties ? ' · Pens' : ''}</span>
                )}
            </div>

            {pending && <p className="kr-pending-text">Match not yet played</p>}

            {!pending && (
                <div className="kr-breakdown">
                    {items.map((item, idx) => (
                        <div key={idx} className={`kr-breakdown-item ${item.ok ? 'kr-breakdown-item--pos' : 'kr-breakdown-item--neg'}`}>
                            <span>{item.label}</span>
                            <span className="kr-breakdown-pts">{item.pts > 0 ? `+${item.pts}` : item.pts}</span>
                        </div>
                    ))}
                    <div className="kr-breakdown-total">
                        <span>Total</span>
                        <span>{total > 0 ? `+${total}` : total}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Round section ────────────────────────────────────────────────
function RoundSection({ round, matches, predictions }) {
    const meta = ROUND_META[round];
    const relevant = matches.filter(m => predictions[m.match_id]);
    if (relevant.length === 0) return null;

    const roundTotal = relevant.reduce((sum, m) => {
        const pred = predictions[m.match_id];
        return sum + (pred.points_awarded ?? 0);
    }, 0);

    return (
        <section className="kr-round">
            <div className="kr-round-header">
                <h2>{meta.icon} {meta.label}</h2>
                <span className="kr-round-total">{roundTotal} <span className="kr-pts-label">pts</span></span>
            </div>
            <div className="kr-matches">
                {relevant.map(m => (
                    <MatchResult key={m.match_id} match={m} pred={predictions[m.match_id]} />
                ))}
            </div>
        </section>
    );
}

// ── Main page ───────────────────────────────────────────────────
export default function KnockoutResults() {
    const { leagueId, userId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [username, setUsername] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [matches, setMatches] = useState([]);
    const [predictions, setPredictions] = useState({});
    const [hasPredictions, setHasPredictions] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { navigate('/login'); return; }
                setIsOwnProfile(user.id === userId);

                // Confirm this user is actually a member of the league being viewed from
                const { data: membership, error: memErr } = await supabase
                    .from('league_members')
                    .select('user_id')
                    .eq('league_id', leagueId)
                    .eq('user_id', userId)
                    .single();
                if (memErr || !membership) {
                    setErrorMsg('Member not found in this league.');
                    setLoading(false);
                    return;
                }

                const { data: profile, error: profileErr } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', userId)
                    .single();
                if (profileErr || !profile) {
                    setErrorMsg('User not found.');
                    setLoading(false);
                    return;
                }
                setUsername(profile.username || userId.slice(0, 8));

                const [{ data: matchData, error: mErr }, { data: predData, error: pErr }] = await Promise.all([
                    supabase.from('knockout_matches').select('*'),
                    supabase.from('knockout_predictions').select('*').eq('user_id', userId),
                ]);
                if (mErr) throw mErr;
                if (pErr) throw pErr;

                setMatches(matchData || []);

                if (!predData || predData.length === 0) {
                    setHasPredictions(false);
                    setLoading(false);
                    return;
                }
                setHasPredictions(true);

                const indexed = {};
                predData.forEach(p => { indexed[p.match_id] = p; });
                setPredictions(indexed);
            } catch (err) {
                console.error(err);
                setErrorMsg('Failed to load knockout predictions.');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [leagueId, userId, navigate]);

    if (loading) {
        return (
            <div className="kr-page">
                <Header activeLink="leagues" />
                <main className="kr-main">
                    <div className="kr-shimmer kr-shimmer--title" />
                    <div className="kr-shimmer kr-shimmer--card" />
                    <div className="kr-shimmer kr-shimmer--card" />
                </main>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="kr-page">
                <Header activeLink="leagues" />
                <main className="kr-main">
                    <button className="kr-back" onClick={() => navigate(-1)}>← Back</button>
                    <p className="kr-error">{errorMsg}</p>
                </main>
            </div>
        );
    }

    if (!hasPredictions) {
        return (
            <div className="kr-page">
                <Header activeLink="leagues" />
                <main className="kr-main">
                    <button className="kr-back" onClick={() => navigate(`/leagues/${leagueId}/members/${userId}`)}>← Back</button>
                    <div className="kr-empty">
                        <span className="kr-empty-icon">⚔️</span>
                        <h2>No knockout predictions yet</h2>
                        <p>@{username} hasn't submitted any knockout round predictions.</p>
                    </div>
                </main>
            </div>
        );
    }

    const totalPoints = Object.values(predictions).reduce((s, p) => s + (p.points_awarded ?? 0), 0);
    const matchesPlayed = matches.filter(m => predictions[m.match_id] && m.winner).length;
    const matchesPicked = Object.keys(predictions).length;

    return (
        <div className="kr-page">
            <Header activeLink="leagues" />
            <main className="kr-main">
                <button className="kr-back" onClick={() => navigate(`/leagues/${leagueId}/members/${userId}`)}>
                    ← @{username}
                </button>

                <div className="kr-hero">
                    <div className="kr-hero-left">
                        <p className="kr-eyebrow">2026 FIFA World Cup · Knockout Stage</p>
                        <h1 className="kr-title">
                            <span className="kr-username">@{username}</span>'s knockout predictions
                        </h1>
                    </div>
                </div>

                <div className="kr-summary">
                    <div className="kr-summary-stat">
                        <span className="kr-summary-num accent">{totalPoints}</span>
                        <span className="kr-summary-label">Points earned</span>
                    </div>
                    <div className="kr-summary-divider" />
                    <div className="kr-summary-stat">
                        <span className="kr-summary-num">{matchesPlayed}</span>
                        <span className="kr-summary-label">Matches scored</span>
                    </div>
                    <div className="kr-summary-divider" />
                    <div className="kr-summary-stat">
                        <span className="kr-summary-num muted">{matchesPicked}</span>
                        <span className="kr-summary-label">Predictions made</span>
                    </div>
                </div>

                {ROUND_ORDER.map(round => (
                    <RoundSection
                        key={round}
                        round={round}
                        matches={matches.filter(m => m.round === round)}
                        predictions={predictions}
                    />
                ))}
            </main>
        </div>
    );
}