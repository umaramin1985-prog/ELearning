import { db } from '../firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { updateSubscriptionStatus } from './subscriptionService';

const DEFAULT_COURSE_ID = 'powerbi';

const readClassesFromCourseDoc = async (courseId = DEFAULT_COURSE_ID) => {
    const courseRef = doc(db, 'courses', courseId);
    const snap = await getDoc(courseRef);
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data.classes) ? data.classes : [];
};

const writeClassesToCourseDoc = async (classesArray, courseId = DEFAULT_COURSE_ID) => {
    const courseRef = doc(db, 'courses', courseId);
    await setDoc(courseRef, { classes: classesArray }, { merge: true });
};

export const createClass = async (name, courseId = DEFAULT_COURSE_ID, sectionId = 'all', studentIds = []) => {
    const targetCourseId = courseId || DEFAULT_COURSE_ID;
    const existing = await readClassesFromCourseDoc(targetCourseId);
    const newClass = {
        id: `cls_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        courseId: targetCourseId,
        sectionId,
        studentIds,
        status: 'active',
        createdAtMs: Date.now(),
        updatedAtMs: Date.now()
    };
    await writeClassesToCourseDoc([newClass, ...existing], targetCourseId);
    return newClass.id;
};

export const getAllClasses = async () => {
    const coursesSnap = await getDocs(collection(db, 'courses'));
    let allClasses = [];
    coursesSnap.forEach(courseDoc => {
        const data = courseDoc.data();
        if (Array.isArray(data.classes)) {
            const normalized = data.classes.map(c => ({
                ...c,
                courseId: c.courseId || courseDoc.id,
                createdAt: c.createdAt || (c.createdAtMs ? { toDate: () => new Date(c.createdAtMs), toMillis: () => c.createdAtMs } : null)
            }));
            allClasses = [...allClasses, ...normalized];
        }
    });
    allClasses.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    return allClasses;
};

export const getUserClasses = async (userId) => {
    if (!userId) return [];
    const allClasses = await getAllClasses();
    return allClasses.filter(c => Array.isArray(c.studentIds) && c.studentIds.includes(userId));
};

export const updateClass = async (classId, data) => {
    const targetCourseId = data.courseId || DEFAULT_COURSE_ID;
    const existing = await readClassesFromCourseDoc(targetCourseId);
    const updated = existing.map(c =>
        c.id === classId
            ? { ...c, ...data, updatedAtMs: Date.now() }
            : c
    );
    await writeClassesToCourseDoc(updated, targetCourseId);
};

export const deleteClass = async (classId, courseId = DEFAULT_COURSE_ID) => {
    const existing = await readClassesFromCourseDoc(courseId);
    const filtered = existing.filter(c => c.id !== classId);
    await writeClassesToCourseDoc(filtered, courseId);
};

export const updateClassCompletionStatus = async (classObj, newStatus, allSubscriptions = []) => {
    const targetCourseId = classObj.courseId || DEFAULT_COURSE_ID;
    const existing = await readClassesFromCourseDoc(targetCourseId);
    const updated = existing.map(c =>
        c.id === classObj.id
            ? {
                  ...c,
                  status: newStatus,
                  completedAtMs: newStatus === 'completed' ? Date.now() : null,
                  updatedAtMs: Date.now()
              }
            : c
    );
    await writeClassesToCourseDoc(updated, targetCourseId);

    const studentIds = Array.isArray(classObj.studentIds) ? classObj.studentIds : [];
    for (const studentId of studentIds) {
        const matchingSubs = allSubscriptions.filter(
            sub =>
                sub.userId === studentId &&
                sub.courseId === targetCourseId &&
                (sub.sectionId === classObj.sectionId || classObj.sectionId === 'all' || sub.sectionId === 'all')
        );

        if (matchingSubs.length > 0) {
            for (const sub of matchingSubs) {
                await updateSubscriptionStatus(sub.id, newStatus, {
                    userId: studentId,
                    courseId: targetCourseId,
                    sectionId: sub.sectionId
                });
            }
        } else if (newStatus === 'completed') {
            const courseName = targetCourseId === 'powerbi'
                ? 'Microsoft Power BI'
                : targetCourseId.toUpperCase();
            const sectionLabel = classObj.sectionId === 'all'
                ? 'Full Course'
                : classObj.sectionId.replace('module-', 'Module ');

            await addDoc(collection(db, 'notifications'), {
                userId: studentId,
                type: 'completion',
                title: `Class Completed: ${classObj.name}`,
                message: `Congratulations! Your instructor marked your class "${classObj.name}" (${courseName} - ${sectionLabel}) as completed.`,
                read: false,
                createdAt: serverTimestamp(),
                link: `/courses#${targetCourseId}`
            });
        }
    }
};
