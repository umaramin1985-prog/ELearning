import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';

const SignUp = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            const result = await register(email, password, `${firstName} ${lastName}`.trim());
            if (result.firestoreUser && !result.firestoreUser.profileComplete) {
                navigate('/profile');
            } else {
                navigate('/courses');
            }
        } catch (err) {
            setError('Failed to create an account: ' + err.message);
            console.error(err);
        }
        setLoading(false);
    };

    const handleGoogleSignUp = async () => {
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
            setError('Failed to sign up with Google.');
            console.error(err);
        }
        setLoading(false);
    }

    return (
        <>
            <SEO 
                title="Sign Up"
                description="Create a YYZ Data Matrix account to start mastering data analytics, business intelligence, Power BI, and more."
                url="/signup"
            />
            <section className="auth-section">
            <div className="auth-card">
                <h2>Create an Account</h2>
                <p>Join us to master data analytics and boost your career.</p>
                {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                
                <button type="button" onClick={handleGoogleSignUp} disabled={loading} className="btn btn-secondary auth-btn google-btn">
                    <i className="fa-brands fa-google"></i> Sign up with Google
                </button>
                
                <div className="divider">
                    <span>or continue with email</span>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="form-control" placeholder="John" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="form-control" placeholder="Doe" required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" placeholder="john@example.com" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" placeholder="Create a secure password" required minLength="6" />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary auth-btn">Create Account</button>
                </form>
                <div className="auth-links">
                    Already have an account? <Link to="/signin">Sign in</Link>
                </div>
            </div>
        </section>
        </>
    );
};

export default SignUp;
