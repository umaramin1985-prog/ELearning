import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

export const getCourses = async () => {
    const coursesCol = collection(db, 'courses');
    const snapshot = await getDocs(coursesCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getCourse = async (courseId) => {
    const courseRef = doc(db, 'courses', courseId);
    const snapshot = await getDoc(courseRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const saveCourse = async (courseId, data) => {
    const courseRef = doc(db, 'courses', courseId);
    await setDoc(courseRef, data, { merge: true });
};

export const getSections = async (courseId) => {
    const sectionsCol = collection(db, `courses/${courseId}/sections`);
    const snapshot = await getDocs(sectionsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveSection = async (courseId, sectionId, data) => {
    const sectionRef = doc(db, `courses/${courseId}/sections`, sectionId);
    await setDoc(sectionRef, data, { merge: true });
};

// Seed initial data if it doesn't exist
export const seedInitialCourses = async () => {
    const powerbiRef = doc(db, 'courses', 'powerbi');
    const powerbiSnap = await getDoc(powerbiRef);
    
    if (!powerbiSnap.exists()) {
        await setDoc(powerbiRef, {
            title: 'Microsoft Power BI',
            overallVideoRate: 499,
            overallLiveRate: 999
        });

        const sections = [
            { id: 'module-1', title: 'Power Query & Data Cleaning (ETL)', videoRate: 99, liveRate: 199, videoLink: 'https://example.com/video1' },
            { id: 'module-2', title: 'Power Pivot, DAX, and Data Analytics', videoRate: 99, liveRate: 199, videoLink: 'https://example.com/video2' },
            { id: 'module-3', title: 'Data Visualization & Storytelling', videoRate: 99, liveRate: 199, videoLink: 'https://example.com/video3' },
            { id: 'module-4', title: 'Data Modeling and Optimization', videoRate: 99, liveRate: 199, videoLink: 'https://example.com/video4' },
            { id: 'module-5', title: 'Power BI Service & Publishing', videoRate: 99, liveRate: 199, videoLink: 'https://example.com/video5' },
            { id: 'module-6', title: 'From Raw Data to Executive Dashboards', videoRate: 99, liveRate: 199, videoLink: 'https://example.com/video6' },
        ];

        for (const section of sections) {
            await setDoc(doc(db, `courses/powerbi/sections`, section.id), section);
        }
    }
};
