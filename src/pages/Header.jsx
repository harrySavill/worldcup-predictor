// src/pages/Header.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './styles/Header.css';

export default function Header({ activeLink = '' }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/login');
            } else {
                setUser(session.user);
                setLoading(false);
            }
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                navigate('/login');
            } else {
                setUser(session.user);
            }
        });

        return () => listener.subscription.unsubscribe();
    }, [navigate]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    const username = user?.user_metadata?.username ||
        user?.email?.split('@')[0] ||
        'Predictor';

    if (loading) return null;

    return (
        <header className="dashboard-header">
            <div className="dashboard-header-inner">
                <Link to="/dashboard" className="dashboard-logo" onClick={closeMenu}>
                    Predictor
                </Link>

                {/* Desktop Navigation */}
                <nav className="dashboard-nav desktop-only">
                    <Link
                        to="/dashboard"
                        className={`nav-link ${activeLink === 'dashboard' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/predictionsMenu"
                        className={`nav-link ${activeLink === 'predictions' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Predictions
                    </Link>
                    <Link
                        to="/leagues"
                        className={`nav-link ${activeLink === 'leagues' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Leagues
                    </Link>
                </nav>

                <div className="dashboard-header-right">
                    <span className="dashboard-username desktop-only">@{username}</span>
                    <button className="btn-signout desktop-only" onClick={handleSignOut}>
                        Sign out
                    </button>

                    {/* Hamburger Button */}
                    <button
                        className="hamburger-btn mobile-only"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
                        <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
                        <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
                <nav className="mobile-nav">
                    <Link
                        to="/dashboard"
                        className={`mobile-nav-link ${activeLink === 'dashboard' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/predictionsMenu"
                        className={`mobile-nav-link ${activeLink === 'predictions' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Predictions
                    </Link>
                    <Link
                        to="/leagues"
                        className={`mobile-nav-link ${activeLink === 'leagues' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Leagues
                    </Link>

                    <div className="mobile-user-info">
                        <span className="dashboard-username">@{username}</span>
                        <button className="btn-signout" onClick={handleSignOut}>
                            Sign out
                        </button>
                    </div>
                </nav>
            </div>
        </header>
    );
}