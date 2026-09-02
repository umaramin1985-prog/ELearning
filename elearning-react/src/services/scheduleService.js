import { db } from '../firebase';
import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';

export const createSession = async (userId, courseId, sectionId, title, startTime, endTime, meetingLink) => {
    const sessionCol = collection(db, 'sessions');
    const docRef = await addDoc(sessionCol, {
        userId,
        courseId,
        sectionId,
        title,
        startTime,
        endTime,
        meetingLink,
        createdAt: serverTimestamp()
    });

    // Create a notification for the user
    await addDoc(collection(db, 'notifications'), {
        userId: userId,
        type: 'session',
        title: 'New Live Session Scheduled',
        message: `A session "${title}" has been scheduled.`,
        read: false,
        createdAt: serverTimestamp(),
        link: '/profile' // Users can see their schedule on their profile (or calendar)
    });

    return docRef.id;
};

export const updateSession = async (sessionId, data) => {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, data);
};

export const deleteSession = async (sessionId) => {
    const sessionRef = doc(db, 'sessions', sessionId);
    await deleteDoc(sessionRef);
};

export const getUserSessions = async (userId) => {
    const sessionCol = collection(db, 'sessions');
    const q = query(sessionCol, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllSessions = async () => {
    const sessionCol = collection(db, 'sessions');
    const snapshot = await getDocs(sessionCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
