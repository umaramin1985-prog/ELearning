import React, { useState } from 'react';
import './StarRating.css';

const StarRating = ({ rating = 0, readOnly = true, onChange = null, maxStars = 5, totalReviews = null }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const handleClick = (star) => {
        if (!readOnly && onChange) {
            onChange(star);
        }
    };

    const renderStars = () => {
        const stars = [];
        const currentRating = !readOnly && hoverRating ? hoverRating : rating;

        for (let i = 1; i <= maxStars; i++) {
            let starClass = "fa-regular fa-star"; // empty star
            
            if (i <= currentRating) {
                starClass = "fa-solid fa-star"; // full star
            } else if (i === Math.ceil(currentRating) && !Number.isInteger(currentRating)) {
                starClass = "fa-solid fa-star-half-stroke"; // half star
            }

            stars.push(
                <i
                    key={i}
                    className={`${starClass} ${readOnly ? 'star-readonly' : 'star-interactive'}`}
                    onMouseEnter={() => !readOnly && setHoverRating(i)}
                    onMouseLeave={() => !readOnly && setHoverRating(0)}
                    onClick={() => handleClick(i)}
                    style={{
                        color: currentRating >= i || (i === Math.ceil(currentRating) && !Number.isInteger(currentRating)) ? '#fbbf24' : '#d1d5db',
                        cursor: readOnly ? 'default' : 'pointer',
                        fontSize: '1.2rem',
                        transition: 'color 0.2s ease-in-out',
                        marginRight: '2px'
                    }}
                ></i>
            );
        }
        return stars;
    };

    return (
        <div className="star-rating-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="stars">
                {renderStars()}
            </div>
            {readOnly && rating > 0 && (
                <span className="rating-text" style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    {rating.toFixed(1)}
                </span>
            )}
            {readOnly && totalReviews !== null && (
                <span className="reviews-count" style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                    ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                </span>
            )}
        </div>
    );
};

export default StarRating;
