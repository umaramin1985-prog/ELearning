import { db } from '../firebase';
import {
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';

export const calculateLetterGrade = (score) => {
    const num = Number(score);
    if (isNaN(num)) return 'N/A';
    if (num >= 90) return 'A+';
    if (num >= 85) return 'A';
    if (num >= 80) return 'A-';
    if (num >= 75) return 'B+';
    if (num >= 70) return 'B';
    if (num >= 65) return 'C+';
    if (num >= 60) return 'C';
    if (num >= 50) return 'D';
    return 'F';
};

export const saveStudentGrade = async ({
    userId,
    courseId,
    sectionId,
    score,
    remarks = '',
    classId = null,
    className = null,
    gradedBy = null,
    subscriptionId = null,
    sendNotification = true
}) => {
    const numericScore = Math.min(100, Math.max(0, Number(score)));
    const letterGrade = calculateLetterGrade(numericScore);
    const trimmedRemarks = remarks.trim();

    if (subscriptionId) {
        const subRef = doc(db, 'subscriptions', subscriptionId);
        await updateDoc(subRef, {
            status: 'completed',
            score: numericScore,
            letterGrade,
            remarks: trimmedRemarks,
            gradedBy,
            completedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    } else {
        const subCol = collection(db, 'subscriptions');
        const q = query(subCol, where('userId', '==', userId));
        const snap = await getDocs(q);
        const matchingDocs = snap.docs.filter(d => {
            const data = d.data();
            return (
                data.courseId === courseId &&
                (data.sectionId === sectionId || sectionId === 'all' || data.sectionId === 'all')
            );
        });

        if (matchingDocs.length > 0) {
            await Promise.all(
                matchingDocs.map(d =>
                    updateDoc(doc(db, 'subscriptions', d.id), {
                        status: 'completed',
                        score: numericScore,
                        letterGrade,
                        remarks: trimmedRemarks,
                        classId: classId || d.data().classId || null,
                        className: className || d.data().className || null,
                        gradedBy,
                        completedAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    })
                )
            );
        } else {
            // Create a completed subscription record for this class student so their grade & completion persist in `subscriptions`
            await addDoc(subCol, {
                userId,
                courseId,
                sectionId,
                type: 'live',
                amount: 0,
                status: 'completed',
                score: numericScore,
                letterGrade,
                remarks: trimmedRemarks,
                classId,
                className,
                gradedBy,
                createdAt: serverTimestamp(),
                completedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
    }

    if (sendNotification && userId) {
        const courseName = courseId === 'powerbi' ? 'Microsoft Power BI' : (courseId || 'Course').toUpperCase();
        const sectionLabel = sectionId === 'all' ? 'Full Course' : sectionId.replace('module-', 'Module ');
        const remarksText = trimmedRemarks ? ` Instructor feedback: "${trimmedRemarks}"` : '';

        await addDoc(collection(db, 'notifications'), {
            userId,
            type: 'completion',
            title: `Grade Posted: ${courseName} (${sectionLabel}) — ${letterGrade} (${numericScore}%)`,
            message: `Congratulations! You completed ${sectionLabel} with a grade of ${letterGrade} (${numericScore}%).${remarksText}`,
            read: false,
            createdAt: serverTimestamp(),
            link: '/courses#mygrades'
        });
    }

    return {
        id: `${userId}_${courseId}_${sectionId}`,
        userId,
        courseId,
        sectionId,
        score: numericScore,
        letterGrade,
        remarks: trimmedRemarks,
        classId,
        className
    };
};

export const getUserGrades = async (userId) => {
    if (!userId) return [];
    const subCol = collection(db, 'subscriptions');
    const q = query(subCol, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(sub => sub.letterGrade !== undefined && sub.score !== undefined)
        .map(sub => ({
            ...sub,
            updatedAt: sub.updatedAt || sub.completedAt || sub.createdAt
        }));
};

export const getAllGrades = async () => {
    const subCol = collection(db, 'subscriptions');
    const snapshot = await getDocs(subCol);
    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(sub => sub.letterGrade !== undefined && sub.score !== undefined)
        .map(sub => ({
            ...sub,
            updatedAt: sub.updatedAt || sub.completedAt || sub.createdAt
        }));
};
