// src/pages/CreateLeague.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Header from './Header';
import './styles/CreateLeague.css';

export default function CreateLeague() {
    const [leagueName, setLeagueName] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successData, setSuccessData] = useState(null);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!leagueName.trim()) {
            setErrorMsg("League name is required");
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

            const { data, error } = await supabase
                .from('leagues')
                .insert({
                    name: leagueName.trim(),
                    owner_id: user.id,
                })
                .select(`
                    *,
                    scoring_rules(*)
                `)
                .single();

            if (error) throw error;

            setSuccessData({
                league: data,
                inviteCode: data.invite_code
            });

        } catch (error) {
            console.error(error);
            setErrorMsg(error.message || 'Failed to create league');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-league-page">
            <Header activeLink="leagues" />

            <main className="create-league-main">
                <div className="create-container">
                    {!successData ? (
                        <>
                            <div className="page-header">
                                <h1>Create New League</h1>
                                <p className="page-subhead">
                                    Start your own private league and invite friends to compete.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="create-form">
                                <div className="form-group">
                                    <label htmlFor="leagueName">League Name</label>
                                    <input
                                        type="text"
                                        id="leagueName"
                                        value={leagueName}
                                        onChange={(e) => setLeagueName(e.target.value)}
                                        placeholder="e.g. Friends Premier League"
                                        maxLength={50}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                {errorMsg && (
                                    <p className="error-message">{errorMsg}</p>
                                )}

                                <button
                                    type="submit"
                                    className="btn primary large"
                                    disabled={loading || !leagueName.trim()}
                                >
                                    {loading ? 'Creating League...' : 'Create League'}
                                </button>
                            </form>

                            <div className="form-footer">
                                <button
                                    type="button"
                                    className="link-accent"
                                    onClick={() => navigate('/leagues/join')}
                                >
                                    ← Join an existing league instead
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="success-state">
                            <div className="success-icon">🏆</div>
                            <h2>League Created Successfully!</h2>
                            <p><strong>{successData.league.name}</strong></p>

                            <div className="invite-box">
                                <p className="invite-label">Your invite code</p>
                                <div className="invite-code">
                                    {successData.inviteCode}
                                </div>
                                <p className="invite-help">
                                    Share this code with friends so they can join your league.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}