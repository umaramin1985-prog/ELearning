import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Loader from '../components/Loader';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './Profile.css';

const Profile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        phone: '',
        category: '',
        company: '',
        position: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setFormData({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        dob: data.dob || '',
                        phone: data.phone || '',
                        category: data.category || '',
                        company: data.company || '',
                        position: data.position || ''
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                setMessage({ type: 'error', text: 'Failed to load profile data.' });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                ...formData,
                profileComplete: true,
                displayName: `${formData.firstName} ${formData.lastName}`.trim() || user.displayName
            });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader />;

    const isProfessional = formData.category === 'Professional';

    return (
        <section className="profile-page-section">
            <div className="container profile-container">
                <div className="profile-card fade-in">
                    <div className="profile-header">
                        <h1>Your Profile</h1>
                        <p>Complete your personal and professional information.</p>
                    </div>

                    {message && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <form className="profile-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name <span className="required">*</span></label>
                                <input type="text" name="firstName" className="form-control" value={formData.firstName} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Last Name <span className="required">*</span></label>
                                <input type="text" name="lastName" className="form-control" value={formData.lastName} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" className="form-control" value={user?.email || ''} disabled />
                            </div>
                            <div className="form-group">
                                <label>Date of Birth <span className="required">*</span></label>
                                <input type="date" name="dob" className="form-control" value={formData.dob} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Contact Phone</label>
                                <PhoneInput
                                    international
                                    defaultCountry="CA"
                                    value={formData.phone || undefined}
                                    onChange={(value) => setFormData(prev => ({ ...prev, phone: value || '' }))}
                                    className="phone-input-custom"
                                />
                            </div>
                            <div className="form-group">
                                <label>Category <span className="required">*</span></label>
                                <select name="category" className="form-control" value={formData.category} onChange={handleChange} required>
                                    <option value="" disabled>Select your status</option>
                                    <option value="Student">Student</option>
                                    <option value="Professional">Professional</option>
                                </select>
                            </div>
                        </div>

                        {isProfessional && (
                            <div className="form-row fade-in">
                                <div className="form-group">
                                    <label>Company</label>
                                    <input type="text" name="company" className="form-control" placeholder="Optional" value={formData.company} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Position</label>
                                    <input type="text" name="position" className="form-control" placeholder="Optional" value={formData.position} onChange={handleChange} />
                                </div>
                            </div>
                        )}

                        <div className="form-actions">
                            <button type="submit" className="btn-save" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Profile;
