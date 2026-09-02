import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, setDoc, doc, getDoc } from 'firebase/firestore';

// Save or update a rating
export const submitRating = async (courseId, sectionId, userId, userName, rating, review) => {
    // We use a composite ID so a user can only have one rating per section/course
    const ratingId = `${userId}_${courseId}_${sectionId}`;
    const ratingRef = doc(db, 'ratings', ratingId);

    await setDoc(ratingRef, {
        courseId,
        sectionId,
        userId,
        userName,
        rating,
        review,
        updatedAt: serverTimestamp()
    }, { merge: true });
    
    return ratingId;
};

// Fetch all ratings for a specific course
export const getRatingsForCourse = async (courseId) => {
    const ratingsCol = collection(db, 'ratings');
    const q = query(ratingsCol, where("courseId", "==", courseId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Check if user has an existing rating
export const getUserRating = async (courseId, sectionId, userId) => {
    const ratingId = `${userId}_${courseId}_${sectionId}`;
    const ratingRef = doc(db, 'ratings', ratingId);
    const snapshot = await getDoc(ratingRef);
    return snapshot.exists() ? snapshot.data() : null;
};

// Fetch all ratings across all courses (for Admin)
export const getAllRatings = async () => {
    const ratingsCol = collection(db, 'ratings');
    const snapshot = await getDocs(ratingsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
