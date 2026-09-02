import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToChat, sendMessage, markChatReadByUser, markChatReadByAdmin, subscribeToActiveChats } from '../services/chatService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const ChatWidget = () => {
    const { user } = useAuth();
    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
    const isAdmin = user && user.email && adminEmails.includes(user.email.toLowerCase());
    
    // Non-admin states
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);
    const [unread, setUnread] = useState(false);
    
    // Admin states
    const [allUsers, setAllUsers] = useState([]);
    const [activeChats, setActiveChats] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    // Hide for unauthenticated users
    const shouldHide = !user;

    // Fetch all users for admin
    useEffect(() => {
        if (!isAdmin) return;
        const fetchAllUsers = async () => {
            const usersCol = collection(db, 'users');
            const snap = await getDocs(usersCol);
            const adminEmails = import.meta.env.VITE_ADMIN_EMAILS ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
            const list = snap.docs.map(doc => ({id: doc.id, ...doc.data()}))
                .filter(u => !(u.email && adminEmails.includes(u.email.toLowerCase())));
            
            list.sort((a, b) => (a.displayName || a.email || a.id).localeCompare(b.displayName || b.email || b.id));
            setAllUsers(list);
        };
        fetchAllUsers();
    }, [isAdmin]);

    // Subscribe to active chats for admin
    useEffect(() => {
        if (!isAdmin) return;
        const unsubscribe = subscribeToActiveChats((chats) => {
            setActiveChats(chats);
        });
        return () => unsubscribe();
    }, [isAdmin]);

    // Subscribe to messages
    const activeChatId = isAdmin ? selectedUser?.id : user?.uid;

    useEffect(() => {
        if (!activeChatId) return;

        const unsubscribe = subscribeToChat(activeChatId, (fetchedMessages) => {
            setMessages(fetchedMessages);
            if (!isAdmin) {
                if (!isOpen && fetchedMessages.length > 0) {
                    const lastMsg = fetchedMessages[fetchedMessages.length - 1];
                    if (lastMsg.isAdmin) {
                        setUnread(true);
                    }
                }
            }
        });
        return () => unsubscribe();
    }, [activeChatId, isOpen, isAdmin]);

    useEffect(() => {
        if (messagesEndRef.current && ((isAdmin && selectedUser && isOpen) || (!isAdmin && isOpen))) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            if (!isAdmin && unread) {
                setUnread(false);
                markChatReadByUser(user?.uid).catch(console.error);
            }
            if (isAdmin && selectedUser) {
                const chatInfo = activeChats.find(c => c.userId === selectedUser.id);
                if (chatInfo?.unreadByAdmin) {
                    markChatReadByAdmin(selectedUser.id).catch(console.error);
                }
            }
        }
    }, [messages, isOpen, unread, user?.uid, isAdmin, selectedUser, activeChats]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unread && !isAdmin) {
            setUnread(false);
            markChatReadByUser(user?.uid).catch(console.error);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (inputValue.trim() === '') return;
        
        const text = inputValue;
        setInputValue('');
        
        try {
            await sendMessage(activeChatId, user?.uid, text, isAdmin);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (shouldHide) return null;

    if (isAdmin) {
        const chatUsersList = allUsers.map(u => {
            const activeChat = activeChats.find(c => c.userId === u.id);
            return {
                ...u,
                unreadByAdmin: activeChat ? activeChat.unreadByAdmin : false,
                lastMessageAt: activeChat ? activeChat.lastMessageAt : null
            };
        }).sort((a, b) => {
            const aTime = a.lastMessageAt?.toMillis?.() || 0;
            const bTime = b.lastMessageAt?.toMillis?.() || 0;
            if (aTime !== bTime) return bTime - aTime;
            return (a.displayName || a.email || a.id).localeCompare(b.displayName || b.email || b.id);
        });

        return (
            <>
                {isOpen && (
                    <div className="admin-chat-sidebar-fixed">
                        {chatUsersList.map(u => (
                            <div 
                                key={u.id} 
                                className={`admin-chat-user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                                onClick={() => setSelectedUser(u)}
                            >
                                <div className="admin-chat-user-avatar">
                                    {u.photoURL ? <img src={u.photoURL} alt="Avatar" referrerPolicy="no-referrer" /> : (u.displayName || u.email || '?').charAt(0).toUpperCase()}
                                    <div className="admin-chat-status-dot" style={{background: u.unreadByAdmin ? 'red' : '#22c55e'}}></div>
                                </div>
                                <div className="admin-chat-user-name">
                                    {u.displayName || u.email}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {selectedUser && isOpen && (
                    <div className="chat-widget" style={{right: '310px'}}>
                        <div id="chat-window" className="chat-window">
                            <div className="chat-header">
                                <div className="chat-header-info">
                                    <div className="chat-avatar">
                                        {selectedUser.photoURL ? <img src={selectedUser.photoURL} alt="Avatar" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} /> : (selectedUser.displayName || selectedUser.email || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4>{selectedUser.displayName || selectedUser.email}</h4>
                                    </div>
                                </div>
                                <button id="chat-close" className="chat-close-btn" onClick={() => setSelectedUser(null)}><i className="fa-solid fa-xmark"></i></button>
                            </div>
                            <div className="chat-messages" id="chat-messages">
                                {messages.length === 0 && (
                                    <div className="message received">
                                        <p>No messages yet. Say hi!</p>
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`message ${msg.isAdmin ? 'sent' : 'received'}`}>
                                        <p>{msg.text}</p>
                                        <span className="time">{msg.createdAt ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <form className="chat-input-area" onSubmit={handleSend}>
                                <input 
                                    type="text" 
                                    id="chat-input"
                                    placeholder="Type a message..." 
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                />
                                <button id="chat-send" type="submit"><i className="fa-solid fa-paper-plane"></i></button>
                            </form>
                        </div>
                    </div>
                )}

                <button 
                    id="admin-chat-toggle" 
                    className="chat-toggle-btn" 
                    aria-label="Toggle Admin Chat" 
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}
                >
                    <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-users'}`}></i>
                    {chatUsersList.some(u => u.unreadByAdmin) && !isOpen && <span className="notification-badge" style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', width: '12px', height: '12px', borderRadius: '50%' }}></span>}
                </button>
            </>
        );
    }

    return (
        <div className="chat-widget">
            <div id="chat-window" className={`chat-window ${isOpen ? '' : 'hidden'}`}>
                <div className="chat-header">
                    <div className="chat-header-info">
                        <div className="chat-avatar"><i className="fa-solid fa-headset"></i></div>
                        <div>
                            <h4>Support</h4>
                            <span className="status">Online</span>
                        </div>
                    </div>
                    <button id="chat-close" className="chat-close-btn" onClick={toggleChat}><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="chat-messages" id="chat-messages">
                    {messages.length === 0 && (
                        <div className="message received">
                            <p>Hi there! 👋 How can we help you with your data journey today?</p>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.senderId === user?.uid ? 'sent' : 'received'}`}>
                            <p>{msg.text}</p>
                            <span className="time">{msg.createdAt ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form className="chat-input-area" onSubmit={handleSend}>
                    <input 
                        type="text" 
                        id="chat-input"
                        placeholder="Type a message..." 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button id="chat-send" type="submit"><i className="fa-solid fa-paper-plane"></i></button>
                </form>
            </div>
            <button id="chat-toggle" className="chat-toggle-btn" aria-label="Open Chat" onClick={toggleChat}>
                <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-comment-dots'}`}></i>
                {unread && !isOpen && <span className="notification-badge" style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', width: '12px', height: '12px', borderRadius: '50%' }}></span>}
            </button>
        </div>
    );
};

export default ChatWidget;
