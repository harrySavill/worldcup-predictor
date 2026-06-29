// src/pages/KnockoutPredictions.jsx
// Reusable knockout predictions page — pass `round` as a URL param (R32 | R16 | QF | SF | F)
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Header from './Header';
import { FLAGS } from '../lib/flags.js';
import { deadlines } from '../lib/deadline.js';
import './styles/KnockoutPredictions.css';

// ── Config ─────────────────────────────────────────────────────────────────
const ROUND_META = {
    R32: { label: 'Round of 32',    short: 'R32', icon: '⚔️',  description: 'Pick the winner of each tie. Ties after 90 minutes go to extra time, then penalties if needed.' },
    R16: { label: 'Round of 16',    short: 'R16', icon: '🎯',  description: 'Choose who makes it through to the quarter-finals.' },
    QF:  { label: 'Quarter-Finals', short: 'QF',  icon: '🏅',  description: 'Four matches, eight teams - predict who makes the semis.' },
    SF:  { label: 'Semi-Finals',    short: 'SF',  icon: '🔥',  description: 'Predict the World Cup finalists' },
    F:   { label: 'Final',          short: 'F',   icon: '🏆',  description: 'Predict the World Cup champion.' },
};

function getDeadlineForRound(round) {
    const map = { R32: deadlines.ro32, R16: deadlines.ro16, QF: deadlines.quarterFinals, SF: deadlines.semiFinals, F: deadlines.final };
    return map[round]?.predictionLock ?? null;
}

// ── Countdown hook ──────────────────────────────────────────────────────────
function useCountdown(deadline) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (!deadline || new Date() >= deadline) return;
        const id = setInterval(() => {
            const t = new Date();
            setNow(t);
            if (t >= deadline) clearInterval(id);
        }, 1000);
        return () => clearInterval(id);
    }, [deadline]);

    if (!deadline) return { isLocked: false };
    const isLocked = now >= deadline;
    const ms = Math.max(0, deadline - now);
    const s = Math.floor(ms / 1000);
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return { isLocked, days, hours, mins, secs };
}

// ── Small components ────────────────────────────────────────────────────────
function Pad(n) { return String(n).padStart(2, '0'); }

function DeadlineBanner({ isLocked, days, hours, mins, secs, deadline }) {
    if (isLocked) {
        return (
            <div className="ko-banner ko-banner--locked">
                <span className="ko-banner-icon">🔒</span>
                <div className="ko-locked-text">
                    <strong>Predictions are locked</strong>
                    <span>This round is underway — check back for the next stage.</span>
                </div>
            </div>
        );
    }
    if (!deadline) return null;
    const showDays = days > 0;
    const dateStr = deadline.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    return (
        <div className="ko-banner ko-banner--open">
            <span className="ko-banner-icon">⏱</span>
            <span className="ko-deadline-label">Closes in</span>
            <div className="ko-timer">
                {showDays && <><span className="ko-tu"><span className="ko-tn">{days}</span><span className="ko-ts">d</span></span><span className="ko-sep">:</span></>}
                <span className="ko-tu"><span className="ko-tn">{Pad(hours)}</span><span className="ko-ts">h</span></span>
                <span className="ko-sep">:</span>
                <span className="ko-tu"><span className="ko-tn">{Pad(mins)}</span><span className="ko-ts">m</span></span>
                <span className="ko-sep">:</span>
                <span className="ko-tu"><span className="ko-tn">{Pad(secs)}</span><span className="ko-ts">s</span></span>
            </div>
            <span className="ko-deadline-date">{dateStr}</span>
        </div>
    );
}

// Score input — clamps to 0–20, spin arrows hidden via CSS
function ScoreInput({ value, onChange, disabled }) {
    return (
        <input
            type="number"
            className="ko-score-input"
            min={0}
            max={20}
            value={value ?? ''}
            placeholder="—"
            disabled={disabled}
            onChange={e => {
                const v = e.target.value === '' ? null : Math.max(0, Math.min(20, parseInt(e.target.value, 10)));
                onChange(isNaN(v) ? null : v);
            }}
        />
    );
}

// ── Score consistency logic ─────────────────────────────────────────────────
function applyScoreChange(pred, field, value, home_team, away_team) {
    const updated = { ...pred, [field]: value };

    const home = field === 'predicted_home_goals' ? value : (pred.predicted_home_goals ?? null);
    const away = field === 'predicted_away_goals' ? value : (pred.predicted_away_goals ?? null);

    if (home !== null && away !== null) {
        if (home > away) {
            updated.predicted_winner = home_team;
            updated.predicted_extra_time = false;
            updated.predicted_penalties = false;
        } else if (away > home) {
            updated.predicted_winner = away_team;
            updated.predicted_extra_time = false;
            updated.predicted_penalties = false;
        } else {
            updated.predicted_extra_time = true;
            updated.predicted_penalties = true;
        }
    }

    return updated;
}

// ── Match card ──────────────────────────────────────────────────────────────
function MatchCard({ match, prediction, onChange, isLocked }) {
    const { match_id, home_team, away_team, scheduled_at } = match;
    const pred = prediction || {};

    const homeSelected = pred.predicted_winner === home_team;
    const awaySelected = pred.predicted_winner === away_team;
    const scoresDraw = pred.predicted_home_goals !== null &&
        pred.predicted_away_goals !== null &&
        pred.predicted_home_goals === pred.predicted_away_goals;

    const selectWinner = (team) => {
        if (isLocked) return;
        const update = { ...pred, predicted_winner: team };
        const home = pred.predicted_home_goals ?? null;
        const away = pred.predicted_away_goals ?? null;
        if (home !== null && away !== null && home !== away) {
            const scoreWinner = home > away ? home_team : away_team;
            if (scoreWinner !== team) {
                update.predicted_home_goals = null;
                update.predicted_away_goals = null;
                update.predicted_extra_time = false;
                update.predicted_penalties = false;
            }
        }
        onChange(match_id, update);
    };

    const handleScoreChange = (field, value) => {
        if (isLocked) return;
        onChange(match_id, applyScoreChange(pred, field, value, home_team, away_team));
    };

    const kickoff = scheduled_at
        ? new Date(scheduled_at).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <div className={`ko-match-card ${homeSelected || awaySelected ? 'ko-match-card--picked' : ''} ${isLocked ? 'ko-match-card--locked' : ''}`}>
            {kickoff && <p className="ko-kickoff">{kickoff}</p>}

            <div className="ko-teams-row">
                <button
                    className={`ko-team-btn ${homeSelected ? 'ko-team-btn--selected' : ''}`}
                    onClick={() => selectWinner(home_team)}
                    disabled={isLocked}
                >
                    <span className="ko-team-flag">{FLAGS[home_team] || '🏳'}</span>
                    <span className="ko-team-name">{home_team}</span>
                    {homeSelected && <span className="ko-tick">✓</span>}
                </button>

                <div className="ko-score-row">
                    <ScoreInput value={pred.predicted_home_goals} onChange={v => handleScoreChange('predicted_home_goals', v)} disabled={isLocked} />
                    <span className="ko-score-sep">–</span>
                    <ScoreInput value={pred.predicted_away_goals} onChange={v => handleScoreChange('predicted_away_goals', v)} disabled={isLocked} />
                </div>

                <button
                    className={`ko-team-btn ko-team-btn--away ${awaySelected ? 'ko-team-btn--selected' : ''}`}
                    onClick={() => selectWinner(away_team)}
                    disabled={isLocked}
                >
                    {awaySelected && <span className="ko-tick">✓</span>}
                    <span className="ko-team-name">{away_team}</span>
                    <span className="ko-team-flag">{FLAGS[away_team] || '🏳'}</span>
                </button>
            </div>

            {(homeSelected || awaySelected || scoresDraw) && (
                <div className="ko-et-row">
                    <label className={`ko-toggle ${pred.predicted_extra_time ? 'ko-toggle--on' : ''} ${isLocked || scoresDraw ? 'ko-toggle--locked' : ''}`}>
                        <input
                            type="checkbox"
                            checked={!!pred.predicted_extra_time}
                            disabled={isLocked || scoresDraw}
                            onChange={e => {
                                const et = e.target.checked;
                                onChange(match_id, {
                                    ...pred,
                                    predicted_extra_time: et,
                                    ...(et ? {} : { predicted_penalties: false }),
                                });
                            }}
                        />
                        <span className="ko-toggle-track"><span className="ko-toggle-thumb" /></span>
                        <span className="ko-toggle-label">
                            Extra time
                            {scoresDraw && <span className="ko-toggle-hint"> (draw after 90)</span>}
                        </span>
                    </label>

                    {pred.predicted_extra_time && (
                        <label className={`ko-toggle ${pred.predicted_penalties ? 'ko-toggle--on' : ''} ${isLocked ? 'ko-toggle--locked' : ''}`}>
                            <input
                                type="checkbox"
                                checked={!!pred.predicted_penalties}
                                disabled={isLocked}
                                onChange={e => onChange(match_id, { ...pred, predicted_penalties: e.target.checked })}
                            />
                            <span className="ko-toggle-track"><span className="ko-toggle-thumb" /></span>
                            <span className="ko-toggle-label">Penalties</span>
                        </label>
                    )}
                </div>
            )}

            {(homeSelected || awaySelected) && (
                <div className="ko-winner-chip">
                    <span className="ko-winner-flag">{FLAGS[pred.predicted_winner] || '🏳'}</span>
                    <span className="ko-winner-name">{pred.predicted_winner} to advance</span>
                    {pred.predicted_extra_time && (
                        <span className="ko-winner-tag">AET{pred.predicted_penalties ? ' · Pens' : ''}</span>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function KnockoutPredictions() {
    const { round } = useParams();
    const navigate = useNavigate();

    const meta = ROUND_META[round];
    const deadline = getDeadlineForRound(round);
    const { isLocked, days, hours, mins, secs } = useCountdown(deadline);

    const [matches, setMatches] = useState([]);
    const [predictions, setPredictions] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        if (!meta) navigate('/predictionsMenu');
    }, [meta, navigate]);

    useEffect(() => {
        if (!meta) return;
        const load = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { navigate('/login'); return; }

                const [{ data: matchData, error: mErr }, { data: predData, error: pErr }] = await Promise.all([
                    supabase.from('knockout_matches').select('*').eq('round', round).order('scheduled_at', { ascending: true }),
                    supabase.from('knockout_predictions').select('*').eq('user_id', user.id).eq('round', round),
                ]);

                if (mErr) throw mErr;
                if (pErr) throw pErr;

                setMatches(matchData || []);

                const indexed = {};
                (predData || []).forEach(p => { indexed[p.match_id] = p; });
                setPredictions(indexed);
            } catch (err) {
                console.error(err);
                setErrorMsg('Failed to load matches.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [round, meta, navigate]);

    const handleChange = useCallback((matchId, updated) => {
        setSaved(false);
        setPredictions(prev => ({ ...prev, [matchId]: { ...prev[matchId], ...updated, match_id: matchId } }));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setErrorMsg(null);
        setSaved(false);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/login'); return; }

            const records = matches
                .filter(m => predictions[m.match_id]?.predicted_winner)
                .map(m => {
                    const p = predictions[m.match_id];
                    return {
                        user_id: user.id,
                        match_id: m.match_id,
                        round,
                        predicted_winner: p.predicted_winner,
                        predicted_home_goals: p.predicted_home_goals ?? null,
                        predicted_away_goals: p.predicted_away_goals ?? null,
                        predicted_extra_time: !!p.predicted_extra_time,
                        predicted_penalties: !!p.predicted_penalties,
                        // Note: id and points_awarded are intentionally omitted so
                        // Postgres keeps the existing values on conflict.
                    };
                });

            if (records.length === 0) {
                setErrorMsg('Pick at least one winner before saving.');
                setSaving(false);
                return;
            }

            const { error } = await supabase
                .from('knockout_predictions')
                .upsert(records, {
                    onConflict: 'user_id,match_id',
                    ignoreDuplicates: false,
                });

            if (error) throw error;

            setSaved(true);
        } catch (err) {
            console.error(err);
            setErrorMsg(err.message || 'Failed to save predictions.');
        } finally {
            setSaving(false);
        }
    };

    if (!meta) return null;

    const pickedCount = matches.filter(m => predictions[m.match_id]?.predicted_winner).length;
    const allPicked = pickedCount === matches.length && matches.length > 0;

    return (
        <div className="ko-page">
            <Header activeLink="predictions" />

            <main className="ko-main">
                <div className="ko-hero">
                    <p className="ko-eyebrow">2026 FIFA World Cup · {meta.label}</p>
                    <h1 className="ko-title">{meta.icon} {meta.label} Predictions</h1>
                    <p className="ko-sub">{meta.description}</p>
                    <div className="ko-stats-row">
                        <div className="ko-stat">
                            <span className="ko-stat-num">{matches.length}</span>
                            <span className="ko-stat-label">Matches</span>
                        </div>
                        <div className="ko-stat">
                            <span className="ko-stat-num" style={{ color: allPicked ? 'var(--accent)' : undefined }}>{pickedCount}/{matches.length}</span>
                            <span className="ko-stat-label">Picked</span>
                        </div>
                    </div>
                </div>

                <DeadlineBanner isLocked={isLocked} days={days} hours={hours} mins={mins} secs={secs} deadline={deadline} />

                {loading && (
                    <div className="ko-shimmer-list">
                        {[...Array(4)].map((_, i) => <div key={i} className="ko-shimmer" />)}
                    </div>
                )}

                {!loading && matches.length === 0 && (
                    <div className="ko-empty">
                        <span className="ko-empty-icon">🏟️</span>
                        <h2>No fixtures yet</h2>
                        <p>Matches for the {meta.label} haven't been confirmed. Check back once the previous round is complete.</p>
                    </div>
                )}

                {!loading && matches.length > 0 && (
                    <div className="ko-matches-list">
                        {matches.map(match => (
                            <MatchCard
                                key={match.match_id}
                                match={match}
                                prediction={predictions[match.match_id]}
                                onChange={handleChange}
                                isLocked={isLocked}
                            />
                        ))}
                    </div>
                )}

                {!loading && matches.length > 0 && (
                    <div className="ko-save-bar">
                        {isLocked ? (
                            <div className="ko-save-locked">
                                <p className="ko-save-locked-title">🔒 Predictions locked</p>
                                <p className="ko-save-locked-sub">
                                    You picked <strong>{pickedCount}</strong> of {matches.length} matches.
                                    {pickedCount < matches.length && ' Unpicked matches score 0 points.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {!allPicked && <p className="ko-save-hint">Pick all {matches.length} winners to complete your predictions — or save a partial set now.</p>}
                                {errorMsg && <p className="ko-save-error">{errorMsg}</p>}
                                {saved && <p className="ko-save-success">✓ Predictions saved!</p>}
                                <button
                                    className={`ko-save-btn ${pickedCount > 0 ? 'ko-save-btn--ready' : ''}`}
                                    onClick={handleSave}
                                    disabled={saving || pickedCount === 0}
                                >
                                    {saving ? 'Saving…' : saved ? '✓ Saved' : pickedCount === matches.length ? 'Save Predictions' : `Save ${pickedCount} of ${matches.length}`}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}