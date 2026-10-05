import React, { useState } from 'react';
import './PaymentModal.css';
import { useAuth } from '../contexts/AuthContext';

const PaymentModal = ({ isOpen, onClose, amount, itemDescription, paymentData }) => {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    if (!isOpen) return null;

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...paymentData,
                    userId: user.uid,
                }),
            });

            const data = await response.json();
            
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error("No URL returned from checkout session API. Server said:", data.error || data);
                alert(`Payment initiation failed: ${data.error || "Unknown error"}`);
                setLoading(false);
            }
        } catch (err) {
            console.error("Payment error:", err);
            alert(`Payment initiation failed: ${err.message}`);
            setLoading(false);
        }
    };

    return (
        <div className="payment-modal-overlay">
            <div className="payment-modal-content">
                <button className="payment-modal-close" onClick={onClose}>&times;</button>
                <h2>Secure Checkout</h2>
                <p className="payment-description">{itemDescription}</p>
                <div className="payment-amount">${amount}</div>

                <div className="payment-methods">
                    <p style={{textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-main)'}}>
                        You will be redirected to Stripe's secure checkout page to complete your payment.
                    </p>
                </div>

                <form className="payment-form" onSubmit={handlePayment}>
                    <button type="submit" className="payment-submit-btn" disabled={loading} style={{background: '#635bff', color: 'white'}}>
                        {loading ? 'Processing...' : `Pay $${amount} with Stripe`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
