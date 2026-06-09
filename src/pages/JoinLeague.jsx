// src/pages/JoinLeague.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Header from './Header';
import './styles/JoinLeague.css';

export default function JoinLeague() {
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successData, setSuccessData] = useState(null);

    const navigate = useNavigate();

    const handleChange = (e) => {
        // Uppercase and strip spaces as they type
        setInviteCode(e.target.value.toUpperCase().replace(/\s/g, ''));
        setErrorMsg(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = inviteCode.trim();
        if (!code) {
            setErrorMsg('Enter an invite code to continue.');
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            // Look up the league by invite code
            const { data: league, error: leagueError } = await supabase
                .from('leagues')
                .select('id, name, owner_id')
                .eq('invite_code', code)
                .single();

            if (leagueError || !league) {
                setErrorMsg('No league found with that code. Check it and try again.');
                return;
            }

            // Check if already a member
            const { data: existing } = await supabase
                .from('league_members')
                .select('id')
                .eq('league_id', league.id)
                .eq('user_id', user.id)
                .single();

            if (existing) {
                setErrorMsg("You're already a member of this league.");
                return;
            }

            // Join the league
            const { error: joinError } = await supabase
                .from('league_members')
                .insert({ league_id: league.id, user_id: user.id });

            if (joinError) throw joinError;

            setSuccessData(league);

        } catch (err) {
            console.error(err);
            setErrorMsg(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="join-league-page">
            <Header activeLink="leagues" />

            <main className="join-league-main">
                <div className="join-container">
                    {!successData ? (
                        <>
                            <div className="page-header">
                                <h1>Join a League</h1>
                                <p className="page-subhead">
                                    Got a code from a friend? Enter it below to join their league.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="join-form">
                                <div className="form-group">
                                    <label htmlFor="inviteCode">Invite Code</label>
                                    <input
                                        type="text"
                                        id="inviteCode"
                                        value={inviteCode}
                                        onChange={handleChange}
                                        placeholder="e.g. A3F9B21C"
                                        maxLength={12}
                                        autoComplete="off"
                                        autoCapitalize="characters"
                                        spellCheck={false}
                                        disabled={loading}
                                        className="code-input"
                                    />
                                </div>

                                {errorMsg && (
                                    <p className="error-message">{errorMsg}</p>
                                )}

                                <button
                                    type="submit"
                                    className="btn primary large"
                                    disabled={loading || !inviteCode.trim()}
                                >
                                    {loading ? 'Joining…' : 'Join League'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="success-state">
                            <div className="success-icon">🎉</div>
                            <h2>You're in!</h2>
                            <p className="success-league-name">{successData.name}</p>
                            <p className="success-subtext">
                                You've joined the league. Start making your predictions now.
                            </p>

                            <div className="success-actions">
                                <button
                                    onClick={() => navigate('/leagues')}
                                    className="btn primary"
                                >
                                    Go to League Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/predictions')}
                                    className="btn secondary"
                                >
                                    Make Predictions
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}