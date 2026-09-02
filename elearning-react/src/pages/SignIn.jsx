import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';

const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            const result = await login(email, password);
            if (result.firestoreUser && !result.firestoreUser.profileComplete) {
                navigate('/profile');
            } else {
                navigate('/courses');
            }
        } catch (err) {
            setError('Failed to sign in. Please check your credentials.');
            console.error(err);
        }
        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        try {
            setError('');
            setLoading(true);
            const result = await loginWithGoogle();
            if (result.firestoreUser && !result.firestoreUser.profileComplete) {
                navigate('/profile');
            } else {
                navigate('/courses');
            }
        } catch (err) {
            setError('Failed to sign in with Google.');
            console.error(err);
        }
        setLoading(false);
    }

    return (
        <>
            <SEO 
                title="Sign In"
                description="Sign in to your YYZ Data Matrix account to access your courses, live sessions, and dashboard."
                url="/signin"
            />
            <section className="auth-section">
            <div className="auth-card">
                <h2>Welcome Back</h2>
                <p>Enter your details to sign in to your account.</p>
                {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                
                <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="btn btn-secondary auth-btn google-btn">
                    <i className="fa-brands fa-google"></i> Sign in with Google
                </button>
                
                <div className="divider">
                    <span>or continue with email</span>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" placeholder="john@example.com" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" placeholder="••••••••" required />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary auth-btn">Sign In</button>
                </form>
                <div className="auth-links">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </div>
            </div>
        </section>
        </>
    );
};

export default SignIn;
