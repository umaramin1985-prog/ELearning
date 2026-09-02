import React, { useState } from 'react';
import StarRating from './StarRating';
import { useAuth } from '../contexts/AuthContext';
import { submitRating } from '../services/ratingService';
import './ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, courseId, sectionId, sectionTitle, initialRating = null }) => {
    const { user } = useAuth();
    const [rating, setRating] = useState(initialRating?.rating || 0);
    const [review, setReview] = useState(initialRating?.review || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a star rating.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await submitRating(
                courseId,
                sectionId,
                user.uid,
                user.displayName || user.email,
                rating,
                review
            );
            
            setSubmitting(false);
            onClose(true); // pass true to indicate success and trigger a reload
        } catch (err) {
            console.error("Error submitting review:", err);
            setError('Failed to submit review. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div className="review-modal-overlay fade-in">
            <div className="review-modal-content">
                <button className="review-modal-close" onClick={() => onClose(false)}>&times;</button>
                
                <h2>Rate {sectionTitle}</h2>
                <p className="review-subtitle">Your feedback helps us improve and helps other students make informed decisions.</p>
                
                {error && <div className="review-error">{error}</div>}

                <form onSubmit={handleSubmit} className="review-form">
                    <div className="review-stars-container">
                        <label>Your Rating <span style={{color: 'red'}}>*</span></label>
                        <StarRating 
                            rating={rating} 
                            readOnly={false} 
                            onChange={(val) => {
                                setRating(val);
                                setError('');
                            }}
                        />
                    </div>

                    <div className="review-text-container">
                        <label>Written Review (Admin Only)</label>
                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Tell us what you thought about this material..."
                            rows={4}
                            className="review-textarea"
                        />
                        <span className="review-hint">Your comment is private and will only be visible to course administrators.</span>
                    </div>

                    <div className="review-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => onClose(false)} disabled={submitting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Submitting...' : (initialRating ? 'Update Review' : 'Submit Review')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
