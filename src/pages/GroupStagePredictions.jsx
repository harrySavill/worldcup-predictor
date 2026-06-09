// src/pages/GroupStagePredictions.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Header from './Header';
import './styles/GroupStagePredictions.css';

// 2026 FIFA World Cup groups
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

// Country flag emojis
const FLAGS = {
    'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'Czechia': '🇨🇿',
    'Canada': '🇨🇦', 'Bosnia & Herzegovina': '🇧🇦', 'Qatar': '🇶🇦', 'Switzerland': '🇨🇭',
    'Brazil': '🇧🇷', 'Morocco': '🇲🇦', 'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'USA': '🇺🇸', 'Paraguay': '🇵🇾', 'Australia': '🇦🇺', 'Turkey': '🇹🇷',
    'Germany': '🇩🇪', 'Curacao': '🇨🇼', 'Ivory Coast': '🇨🇮', 'Ecuador': '🇪🇨',
    'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'Sweden': '🇸🇪', 'Tunisia': '🇹🇳',
    'Belgium': '🇧🇪', 'Egypt': '🇪🇬', 'Iran': '🇮🇷', 'New Zealand': '🇳🇿',
    'Spain': '🇪🇸', 'Cape Verde': '🇨🇻', 'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾',
    'France': '🇫🇷', 'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Norway': '🇳🇴',
    'Argentina': '🇦🇷', 'Algeria': '🇩🇿', 'Austria': '🇦🇹', 'Jordan': '🇯🇴',
    'Portugal': '🇵🇹', 'DR Congo': '🇨🇩', 'Uzbekistan': '🇺🇿', 'Colombia': '🇨🇴',
    'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷', 'Ghana': '🇬🇭', 'Panama': '🇵🇦',
};

const TOTAL_THIRDS = 8;

function GroupCard({ groupLetter, teams, onChange }) {
    const [order, setOrder] = useState(teams);
    const dragItem = useRef(null);
    const dragOver = useRef(null);
    const [dragging, setDragging] = useState(null);
    const [dragTarget, setDragTarget] = useState(null);

    const handleDragStart = (e, idx) => {
        dragItem.current = idx;
        setDragging(idx);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e, idx) => {
        e.preventDefault();
        dragOver.current = idx;
        setDragTarget(idx);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (dragItem.current === null || dragOver.current === null) return;
        if (dragItem.current === dragOver.current) {
            setDragging(null);
            setDragTarget(null);
            return;
        }
        const updated = [...order];
        const [moved] = updated.splice(dragItem.current, 1);
        updated.splice(dragOver.current, 0, moved);
        setOrder(updated);
        onChange(groupLetter, updated);
        dragItem.current = null;
        dragOver.current = null;
        setDragging(null);
        setDragTarget(null);
    };

    const handleDragEnd = () => {
        setDragging(null);
        setDragTarget(null);
    };

    const positionLabels = ['1st', '2nd', '3rd', '4th'];
    const positionColors = ['var(--qual-first)', 'var(--qual-second)', 'var(--qual-third)', 'var(--qual-out)'];
    const positionDesc = ['Advances', 'Advances', 'Maybe', 'Eliminated'];

    return (
        <div className="group-card">
            <div className="group-header">
                <span className="group-letter">Group {groupLetter}</span>
                <div className="group-legend">
                    <span className="legend-dot" style={{ background: 'var(--qual-first)' }} />
                    <span className="legend-text">R32</span>
                    <span className="legend-dot" style={{ background: 'var(--qual-third)' }} />
                    <span className="legend-text">TBD</span>
                </div>
            </div>
            <ul className="team-list" onDragOver={handleDragOver} onDrop={handleDrop}>
                {order.map((team, idx) => (
                    <li
                        key={team}
                        className={`team-row
                            ${idx < 2 ? 'qualifies' : ''}
                            ${idx === 2 ? 'maybe' : ''}
                            ${idx === 3 ? 'eliminated' : ''}
                            ${dragging === idx ? 'dragging' : ''}
                            ${dragTarget === idx && dragging !== idx ? 'drag-over' : ''}
                        `}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragEnter={(e) => handleDragEnter(e, idx)}
                        onDragEnd={handleDragEnd}
                    >
                        <span className="position-badge" style={{ color: positionColors[idx] }}>
                            {positionLabels[idx]}
                        </span>
                        <span className="team-flag">{FLAGS[team] || '🏳'}</span>
                        <span className="team-name">{team}</span>
                        <span className="team-status" style={{ color: positionColors[idx] }}>
                            {positionDesc[idx]}
                        </span>
                        <span className="drag-handle" aria-hidden="true">⠿</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ThirdsSelector({ predictions, selectedThirds, onChange }) {
    const allThirds = Object.entries(predictions)
        .map(([group, teams]) => ({ group, team: teams[2] }))
        .filter(({ team }) => team);

    const toggle = (group) => {
        if (selectedThirds.includes(group)) {
            onChange(selectedThirds.filter(g => g !== group));
        } else if (selectedThirds.length < TOTAL_THIRDS) {
            onChange([...selectedThirds, group]);
        }
    };

    const remaining = TOTAL_THIRDS - selectedThirds.length;

    return (
        <div className="thirds-section">
            <div className="thirds-header">
                <div>
                    <h2 className="thirds-title">Third-placed qualifiers</h2>
                    <p className="thirds-sub">
                        Pick <strong>{TOTAL_THIRDS}</strong> of the 12 third-placed teams to advance to the Round of 32.
                    </p>
                </div>
                <div className={`thirds-counter ${remaining === 0 ? 'complete' : ''}`}>
                    <span className="counter-num">{selectedThirds.length}</span>
                    <span className="counter-denom">/ {TOTAL_THIRDS}</span>
                </div>
            </div>
            {remaining > 0 && (
                <p className="thirds-remaining">Select {remaining} more</p>
            )}
            {remaining === 0 && (
                <p className="thirds-complete">✓ All third-place selections made</p>
            )}
            <div className="thirds-grid">
                {allThirds.map(({ group, team }) => {
                    const selected = selectedThirds.includes(group);
                    const disabled = !selected && selectedThirds.length >= TOTAL_THIRDS;
                    return (
                        <button
                            key={group}
                            className={`third-chip ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                            onClick={() => !disabled && toggle(group)}
                            disabled={disabled}
                            title={`Group ${group} third place`}
                        >
                            <span className="chip-flag">{FLAGS[team] || '🏳'}</span>
                            <span className="chip-name">{team}</span>
                            <span className="chip-group">Grp {group}</span>
                            {selected && <span className="chip-check">✓</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function GroupStagePredictions() {
    const navigate = useNavigate();
    const [predictions, setPredictions] = useState(
        Object.fromEntries(Object.entries(GROUPS_DATA).map(([g, teams]) => [g, [...teams]]))
    );
    const [selectedThirds, setSelectedThirds] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load existing predictions
    useEffect(() => {
        const loadPredictions = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    navigate('/login');
                    return;
                }

                const { data, error } = await supabase
                    .from('group_stage_predictions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('group_id', { ascending: true })
                    .order('predicted_position', { ascending: true });

                if (error) throw error;

                if (data && data.length > 0) {
                    const loadedPredictions = {};
                    const loadedThirds = [];

                    data.forEach(row => {
                        if (!loadedPredictions[row.group_id]) {
                            loadedPredictions[row.group_id] = [];
                        }
                        loadedPredictions[row.group_id][row.predicted_position - 1] = row.team_id;

                        if (row.is_third_place_progressor) {
                            loadedThirds.push(row.group_id);
                        }
                    });

                    // Fill any missing groups with default order
                    Object.keys(GROUPS_DATA).forEach(group => {
                        if (!loadedPredictions[group]) {
                            loadedPredictions[group] = [...GROUPS_DATA[group]];
                        }
                    });

                    setPredictions(loadedPredictions);
                    setSelectedThirds(loadedThirds);
                }
            } catch (err) {
                console.error('Error loading predictions:', err);
            } finally {
                setLoading(false);
            }
        };

        loadPredictions();
    }, [navigate]);

    const handleGroupChange = (groupLetter, newOrder) => {
        setPredictions(prev => ({ ...prev, [groupLetter]: newOrder }));
        setSaved(false);
    };

    const isComplete = selectedThirds.length === TOTAL_THIRDS;

    const handleSave = async () => {
        if (!isComplete) return;

        setSaving(true);
        setErrorMsg(null);
        setSaved(false);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            const userId = user.id;
            const records = [];

            Object.entries(predictions).forEach(([group_id, teams]) => {
                teams.forEach((team_id, index) => {
                    const predicted_position = index + 1;
                    const is_third_place_progressor =
                        predicted_position === 3 && selectedThirds.includes(group_id);

                    records.push({
                        user_id: userId,
                        team_id,
                        group_id,
                        predicted_position,
                        is_third_place_progressor,
                    });
                });
            });

            await supabase
                .from('group_stage_predictions')
                .delete()
                .eq('user_id', userId);

            const { error } = await supabase
                .from('group_stage_predictions')
                .insert(records);

            if (error) throw error;

            setSaved(true);
        } catch (err) {
            console.error('Save error:', err);
            setErrorMsg(err.message || 'Failed to save predictions');
        } finally {
            setSaving(false);
        }
    };

    const completedGroups = Object.keys(predictions).length;
    const buttonText = saved ? '✓ Saved' :
        (Object.keys(predictions).some(g =>
            JSON.stringify(predictions[g]) !== JSON.stringify(GROUPS_DATA[g]) ||
            selectedThirds.length > 0) ? 'Update Predictions' : 'Save Predictions');

    if (loading) {
        return (
            <div className="gsp-page">
                <Header activeLink="predictions" />
                <main className="gsp-main">
                    <p style={{ textAlign: 'center', padding: '4rem' }}>Loading your predictions...</p>
                </main>
            </div>
        );
    }

    return (
        <div className="gsp-page">
            <Header activeLink="predictions" />
            <main className="gsp-main">
                <div className="gsp-hero">
                    <p className="gsp-eyebrow">2026 FIFA World Cup</p>
                    <h1 className="gsp-title">Group Stage Predictions</h1>
                    <p className="gsp-sub">
                        Drag teams into your predicted finishing order for each group.
                        Top 2 qualify automatically — then pick which 8 third-placed sides advance.
                    </p>
                    <div className="gsp-progress-row">
                        <div className="gsp-stat">
                            <span className="gsp-stat-num">{completedGroups}</span>
                            <span className="gsp-stat-label">Groups arranged</span>
                        </div>
                        <div className="gsp-stat">
                            <span className="gsp-stat-num" style={{ color: selectedThirds.length === TOTAL_THIRDS ? 'var(--accent)' : 'var(--text-muted)' }}>
                                {selectedThirds.length}/{TOTAL_THIRDS}
                            </span>
                            <span className="gsp-stat-label">Thirds chosen</span>
                        </div>
                        <div className="gsp-stat">
                            <span className="gsp-stat-num">
                                {Object.values(predictions).length * 2 + selectedThirds.length}
                            </span>
                            <span className="gsp-stat-label">Teams advancing</span>
                        </div>
                    </div>
                </div>

                <div className="gsp-legend-bar">
                    <span><span className="legend-pip" style={{ background: 'var(--qual-first)' }}></span>Qualifies (1st/2nd)</span>
                    <span><span className="legend-pip" style={{ background: 'var(--qual-third)' }}></span>3rd — pick below</span>
                    <span><span className="legend-pip" style={{ background: 'var(--qual-out)' }}></span>Eliminated</span>
                </div>

                <div className="groups-grid">
                    {Object.entries(GROUPS_DATA).map(([letter, teams]) => (
                        <GroupCard
                            key={letter}
                            groupLetter={letter}
                            teams={predictions[letter] || teams}
                            onChange={handleGroupChange}
                        />
                    ))}
                </div>

                <ThirdsSelector
                    predictions={predictions}
                    selectedThirds={selectedThirds}
                    onChange={setSelectedThirds}
                />

                <div className="gsp-save-bar">
                    {!isComplete && (
                        <p className="save-hint">
                            Select all {TOTAL_THIRDS} third-place qualifiers to save your predictions.
                        </p>
                    )}
                    {errorMsg && <p className="save-error">{errorMsg}</p>}
                    {saved && <p className="save-success">✓ Predictions updated successfully!</p>}

                    <button
                        className={`btn-save ${isComplete ? 'ready' : ''}`}
                        onClick={handleSave}
                        disabled={!isComplete || saving}
                    >
                        {saving ? 'Saving…' : buttonText}
                    </button>
                </div>
            </main>
        </div>
    );
}