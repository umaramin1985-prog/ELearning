import React, { useState } from 'react';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, amount, itemDescription, onSuccess }) => {
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handlePayment = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate payment processing
        setTimeout(() => {
            setLoading(false);
            onSuccess({
                method: paymentMethod,
                amount: amount,
                transactionId: `mock_tx_${Math.random().toString(36).substring(7)}`,
            });
            onClose();
        }, 1500);
    };

    return (
        <div className="payment-modal-overlay">
            <div className="payment-modal-content">
                <button className="payment-modal-close" onClick={onClose}>&times;</button>
                <h2>Checkout</h2>
                <p className="payment-description">{itemDescription}</p>
                <div className="payment-amount">${amount}</div>

                <div className="payment-methods">
                    <label className={`payment-method ${paymentMethod === 'card' ? 'active' : ''}`}>
                        <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                        <i className="fa-regular fa-credit-card"></i> Credit Card
                    </label>
                    <label className={`payment-method ${paymentMethod === 'paypal' ? 'active' : ''}`}>
                        <input type="radio" value="paypal" checked={paymentMethod === 'paypal'} onChange={() => setPaymentMethod('paypal')} />
                        <i className="fa-brands fa-paypal"></i> PayPal
                    </label>
                </div>

                <form className="payment-form" onSubmit={handlePayment}>
                    {paymentMethod === 'card' && (
                        <>
                            <div className="form-group">
                                <label>Card Number</label>
                                <input type="text" placeholder="**** **** **** ****" required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Expiry Date</label>
                                    <input type="text" placeholder="MM/YY" required />
                                </div>
                                <div className="form-group">
                                    <label>CVC</label>
                                    <input type="text" placeholder="123" required />
                                </div>
                            </div>
                        </>
                    )}
                    {paymentMethod === 'paypal' && (
                        <div className="paypal-mock-msg">
                            <p>You will be redirected to PayPal (Mock).</p>
                        </div>
                    )}
                    
                    <button type="submit" className="payment-submit-btn" disabled={loading}>
                        {loading ? 'Processing...' : `Pay $${amount}`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
