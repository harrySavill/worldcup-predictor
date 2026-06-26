// src/pages/PredictionsMenu.jsx
import { Link } from 'react-router-dom';
import { deadlines } from '../lib/deadline';
import Header from './Header';
import './styles/PredictionsMenu.css';

const now = new Date();

const groupStageLocked   = now >= deadlines.groupStage.predictionLock;
const groupStageComplete = now >= deadlines.groupStage.roundComplete;
const ro32Locked         = now >= deadlines.ro32.predictionLock;
const ro32Complete       = now >= deadlines.ro32.roundComplete;
const ro16Locked         = now >= deadlines.ro16.predictionLock;
const ro16Complete       = now >= deadlines.ro16.roundComplete;
const qfLocked           = now >= deadlines.quarterFinals.predictionLock;
const qfComplete         = now >= deadlines.quarterFinals.roundComplete;
const sfLocked           = now >= deadlines.semiFinals.predictionLock;
const sfComplete         = now >= deadlines.semiFinals.roundComplete;
const finalLocked        = now >= deadlines.final.predictionLock;

const stages = [
    {
        id: 'group',
        icon: '🌍',
        label: 'Group Stage',
        description: 'Predict how every group finishes and which 8 third-placed sides advance.',
        to: '/predictions/groupstage/result',
        status: groupStageLocked ? 'done' : 'open',
    },
    {
        id: 'ro32',
        icon: '⚔️',
        label: 'Round of 32',
        description: 'Pick the 16 sides who progress from the opening knockout round.',
        to: '/predictions/knockout/R32',
        status: !groupStageComplete ? 'unavailable' : ro32Locked ? 'done' : 'open',
    },
    {
        id: 'ro16',
        icon: '🎯',
        label: 'Round of 16',
        description: 'Choose who makes it through to the quarter-finals.',
        to: '/predictions/knockout/R16',
        status: !ro32Complete ? 'unavailable' : ro16Locked ? 'done' : 'open',
    },
    {
        id: 'qf',
        icon: '🏅',
        label: 'Quarter-Finals',
        description: 'Predict the last eight standing.',
        to: '/predictions/knockout/QF',
        status: !ro16Complete ? 'unavailable' : qfLocked ? 'done' : 'open',
    },
    {
        id: 'sf',
        icon: '🔥',
        label: 'Semi-Finals',
        description: 'Who makes it to the final weekend?',
        to: '/predictions/knockout/SF',
        status: !qfComplete ? 'unavailable' : sfLocked ? 'done' : 'open',
    },
    {
        id: 'final',
        icon: '🏆',
        label: 'Final & Third Place',
        description: 'Crown your World Cup champion and pick the bronze medal match result.',
        to: '/predictions/knockout/F',
        status: !sfComplete ? 'unavailable' : finalLocked ? 'done' : 'open',
    },
];

const availableStages = stages.filter(s => s.status !== 'unavailable');
const upcomingStages  = stages.filter(s => s.status === 'unavailable');

function CardBadge({ status }) {
    if (status === 'done') return <span className="pm-badge pm-badge--done">✓ Locked in</span>;
    return null;
}

function StageCard({ stage }) {
    const { icon, label, description, to, status } = stage;
    const isClickable = status !== 'unavailable' && to;

    const cardClass = [
        'pm-card',
        status === 'done'        ? 'pm-card--done'        : '',
        status === 'unavailable' ? 'pm-card--unavailable' : '',
    ].filter(Boolean).join(' ');

    const inner = (
        <>
            <span className="pm-card-icon">{icon}</span>
            <div className="pm-card-body">
                <h2>{label}</h2>
                <p>{status === 'unavailable' ? 'Unlocks once the previous round is complete.' : description}</p>
            </div>
            <div className="pm-card-right">
                <CardBadge status={status} />
                {isClickable && <span className="pm-arrow">→</span>}
            </div>
        </>
    );

    if (isClickable) {
        return <Link to={to} className={cardClass}>{inner}</Link>;
    }

    return <div className={cardClass}>{inner}</div>;
}

export default function PredictionsMenu() {
    return (
        <div className="predictor-menu-page">
            <Header activeLink="predictions" />

            <main className="predictor-menu-main">

                <section className="pm-hero">
                    <p className="pm-eyebrow">2026 FIFA World Cup</p>
                    <h1 className="pm-title">Your Predictions</h1>
                    <p className="pm-sub">
                        Work through each stage of the tournament. Rounds unlock as the competition
                        progresses — earlier predictions score more points.
                    </p>
                </section>

                {availableStages.length > 0 && (
                    <div>
                        <p className="pm-section-label">Open for predictions</p>
                        <div className="pm-cards-group">
                            {availableStages.map(stage => (
                                <StageCard key={stage.id} stage={stage} />
                            ))}
                        </div>
                    </div>
                )}

                {upcomingStages.length > 0 && (
                    <div>
                        <p className="pm-section-label">Upcoming rounds</p>
                        <div className="pm-cards-group">
                            {upcomingStages.map(stage => (
                                <StageCard key={stage.id} stage={stage} />
                            ))}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}