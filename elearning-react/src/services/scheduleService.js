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
        link: '/courses#myschedule'
    });

    return docRef.id;
};

export const createClassSession = async (classObj, title, startTime, endTime, meetingLink) => {
    const sessionCol = collection(db, 'sessions');
    const notifCol = collection(db, 'notifications');
    const studentIds = Array.isArray(classObj.studentIds) ? classObj.studentIds : [];
    const batchGroupId = `class_sess_${Date.now()}`;

    const createdDocs = await Promise.all(
        studentIds.map(async (studentId) => {
            const docRef = await addDoc(sessionCol, {
                userId: studentId,
                classId: classObj.id,
                className: classObj.name,
                batchGroupId,
                studentCount: studentIds.length,
                courseId: classObj.courseId || 'powerbi',
                sectionId: classObj.sectionId || 'all',
                title,
                startTime,
                endTime,
                meetingLink,
                createdAt: serverTimestamp()
            });

            await addDoc(notifCol, {
                userId: studentId,
                type: 'session',
                title: `Class Session Scheduled: ${classObj.name}`,
                message: `A session "${title}" has been scheduled for your class "${classObj.name}".`,
                read: false,
                createdAt: serverTimestamp(),
                link: '/courses#myschedule'
            });

            return docRef.id;
        })
    );

    return createdDocs[0] || batchGroupId;
};

export const updateSession = async (sessionId, data) => {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, data);
};

export const deleteSession = async (sessionId, relatedIds = []) => {
    const idsToDelete = Array.isArray(relatedIds) && relatedIds.length > 0 ? relatedIds : [sessionId];
    await Promise.all(idsToDelete.map(id => deleteDoc(doc(db, 'sessions', id))));
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
    const rawSessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Deduplicate class batch sessions for the master admin calendar view
    const groupedByBatch = new Map();
    const result = [];

    for (const s of rawSessions) {
        if (s.batchGroupId) {
            if (!groupedByBatch.has(s.batchGroupId)) {
                const entry = {
                    ...s,
                    relatedSessionIds: [s.id],
                    studentIds: [s.userId]
                };
                groupedByBatch.set(s.batchGroupId, entry);
                result.push(entry);
            } else {
                const existing = groupedByBatch.get(s.batchGroupId);
                existing.relatedSessionIds.push(s.id);
                if (!existing.studentIds.includes(s.userId)) {
                    existing.studentIds.push(s.userId);
                }
            }
        } else {
            result.push(s);
        }
    }

    return result;
};
