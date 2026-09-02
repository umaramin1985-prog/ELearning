import { db } from '../firebase';
import { collection, doc, addDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, updateDoc, setDoc, getDoc } from 'firebase/firestore';

export const subscribeToChat = (userId, callback) => {
    const messagesRef = collection(db, 'chats', userId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(messages);
    });
};

export const sendMessage = async (userId, senderId, text, isAdmin = false) => {
    // 1. Add the message to the chat subcollection
    const messagesRef = collection(db, 'chats', userId, 'messages');
    await addDoc(messagesRef, {
        senderId,
        text,
        createdAt: serverTimestamp(),
        isAdmin
    });

    // 2. Ensure the root chat document exists (so we can query active chats)
    try {
        const chatRef = doc(db, 'chats', userId);
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        let userName = 'Unknown User';
        if (userSnap.exists()) {
            const userData = userSnap.data();
            userName = userData.firstName ? `${userData.firstName} ${userData.lastName}` : (userData.email || 'User');
        }

        await setDoc(chatRef, {
            userId: userId,
            userName: userName,
            lastMessage: text,
            lastMessageAt: serverTimestamp(),
            unreadByAdmin: !isAdmin,
            unreadByUser: isAdmin
        }, { merge: true });
    } catch (err) {
        console.warn("Could not update root chat doc:", err);
    }

    // 3. Create a notification
    try {
        const targetUserId = isAdmin ? userId : 'admin';
        const notificationTitle = isAdmin ? 'New Chat Message from Admin' : `New Chat Message from ${userName}`;
        
        await addDoc(collection(db, 'notifications'), {
            userId: targetUserId,
            type: 'chat',
            title: notificationTitle,
            message: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
            read: false,
            createdAt: serverTimestamp(),
            link: isAdmin ? '/profile' : '/admin',
            chatUserId: userId
        });
    } catch (err) {
        console.warn("Could not add notification:", err);
    }
};

export const subscribeToActiveChats = (callback) => {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, orderBy('lastMessageAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const chats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(chats);
    });
};

export const markChatReadByAdmin = async (userId) => {
    const chatRef = doc(db, 'chats', userId);
    await updateDoc(chatRef, {
        unreadByAdmin: false
    });
};

export const markChatReadByUser = async (userId) => {
    const chatRef = doc(db, 'chats', userId);
    await updateDoc(chatRef, {
        unreadByUser: false
    });
};
