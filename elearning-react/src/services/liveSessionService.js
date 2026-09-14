import { collection, addDoc, getDocs, doc, updateDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const startLiveSession = async (courseId, sectionId, title, adminId) => {
    try {
        const roomId = `${courseId}-${sectionId}-live-${Date.now()}`;
        const docRef = await addDoc(collection(db, 'liveSessions'), {
            roomId,
            courseId,
            sectionId,
            title,
            isActive: true,
            startedAt: new Date(),
            createdBy: adminId
        });
        return { id: docRef.id, roomId, courseId, sectionId, title };
    } catch (error) {
        console.error("Error starting live session:", error);
        alert("Detailed Error: " + error.message);
        throw error;
    }
};

export const endLiveSession = async (sessionId) => {
    try {
        const sessionRef = doc(db, 'liveSessions', sessionId);
        await updateDoc(sessionRef, {
            isActive: false,
            endedAt: new Date()
        });
    } catch (error) {
        console.error("Error ending live session:", error);
        throw error;
    }
};

export const subscribeToActiveSessions = (callback) => {
    const q = query(collection(db, 'liveSessions'), where("isActive", "==", true));
    return onSnapshot(q, (snapshot) => {
        const sessions = [];
        const now = Date.now();
        snapshot.forEach((doc) => {
            const data = doc.data();
            const startedAt = typeof data.startedAt?.toMillis === 'function' ? data.startedAt.toMillis() : (data.startedAt?.seconds ? data.startedAt.seconds * 1000 : 0);
            
            // Ignore zombie sessions older than 12 hours
            if (now - startedAt < 43200000) {
                sessions.push({ id: doc.id, ...data });
            }
        });
        callback(sessions);
    });
};

export const endAllActiveSessions = async () => {
    try {
        const q = query(collection(db, 'liveSessions'), where("isActive", "==", true));
        const snapshot = await getDocs(q);
        const updates = snapshot.docs.map(docSnapshot => 
            updateDoc(doc(db, 'liveSessions', docSnapshot.id), {
                isActive: false,
                endedAt: new Date()
            })
        );
        await Promise.all(updates);
    } catch (error) {
        console.error("Error ending all active sessions:", error);
        throw error;
    }
};

export const getLiveSessionByRoomId = async (roomId) => {
    const q = query(collection(db, 'liveSessions'), where("roomId", "==", roomId), where("isActive", "==", true));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
    return null;
};

export const subscribeToLiveSessionByRoomId = (roomId, callback) => {
    const q = query(collection(db, 'liveSessions'), where("roomId", "==", roomId));
    return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } else {
            callback(null);
        }
    });
};
