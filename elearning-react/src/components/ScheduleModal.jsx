import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import './ScheduleModal.css';

const ScheduleModal = ({ isOpen, onClose, slotInfo, onSubmit, isAdmin }) => {
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');

    useEffect(() => {
        if (isAdmin && isOpen) {
            const fetchUsers = async () => {
                const usersCol = collection(db, 'users');
                const userSnapshot = await getDocs(usersCol);
                const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                const adminEmails = import.meta.env.VITE_ADMIN_EMAILS ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
                setUsers(userList.filter(u => !adminEmails.includes(u.email?.toLowerCase())));
            };
            fetchUsers();
        }
    }, [isAdmin, isOpen]);

    useEffect(() => {
        if (isOpen && slotInfo) {
            setTitle('');
            // Format start/end for time inputs (HH:MM)
            const formatTime = (date) => {
                return date.toTimeString().slice(0, 5);
            };
            
            // If they clicked a whole day in month view, it defaults to midnight.
            // Let's set some default times if they clicked a month cell.
            const isAllDay = slotInfo.action === 'click' && slotInfo.start.getHours() === 0;
            
            if (isAllDay) {
                setStartTime('09:00');
                setEndTime('10:00');
            } else {
                setStartTime(formatTime(slotInfo.start));
                setEndTime(formatTime(slotInfo.end));
            }
        }
    }, [isOpen, slotInfo]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Construct full Date objects for start and end
        const baseDate = new Date(slotInfo.start);
        
        const [startHours, startMinutes] = startTime.split(':');
        const finalStart = new Date(baseDate);
        finalStart.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10), 0);

        const [endHours, endMinutes] = endTime.split(':');
        const finalEnd = new Date(baseDate);
        finalEnd.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10), 0);

        if (finalEnd <= finalStart) {
            alert("End time must be after start time.");
            return;
        }

        onSubmit({
            title,
            start: finalStart,
            end: finalEnd,
            userId: isAdmin ? selectedUserId : null
        });
    };

    return (
        <div className="payment-modal-overlay">
            <div className="payment-modal-content schedule-modal-content">
                <button className="payment-modal-close" onClick={onClose}>&times;</button>
                <h2>Request Live Session</h2>
                <p className="payment-description">Select the time slot for your new live class.</p>
                
                <form onSubmit={handleSubmit} className="schedule-form">
                    <div className="form-group">
                        <label>Session Title</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Data Modeling Help"
                            required 
                            className="form-control"
                            style={{ background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                        />
                    </div>
                    
                    {isAdmin && (
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label>Select User</label>
                            <select 
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                required={isAdmin}
                                className="form-control"
                                style={{ background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                            >
                                <option value="">-- Select User --</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.email || u.displayName}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    <div className="form-row" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Start Time</label>
                            <input 
                                type="time" 
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required 
                                className="form-control"
                                style={{ background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>End Time</label>
                            <input 
                                type="time" 
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required 
                                className="form-control"
                                style={{ background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="admin-action-btn mt-3" style={{ width: '100%', marginTop: '1.5rem' }}>
                        Submit Request
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ScheduleModal;
