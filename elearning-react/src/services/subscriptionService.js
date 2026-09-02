import { db } from '../firebase';
import { collection, doc, addDoc, getDocs, query, where, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';

export const createSubscription = async (userId, courseId, sectionId, type, amount, paymentMethod) => {
    // Create subscription
    const subCol = collection(db, 'subscriptions');
    const subRef = await addDoc(subCol, {
        userId,
        courseId,
        sectionId, // can be 'all' for full course
        type, // 'video' or 'live'
        amount,
        status: 'active',
        createdAt: serverTimestamp()
    });

    // Create transaction
    const transCol = collection(db, 'transactions');
    await addDoc(transCol, {
        userId,
        subscriptionId: subRef.id,
        amount,
        paymentMethod,
        date: serverTimestamp()
    });

    return subRef.id;
};

export const getUserSubscriptions = async (userId) => {
    const subCol = collection(db, 'subscriptions');
    const q = query(subCol, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllSubscriptions = async () => {
    const subCol = collection(db, 'subscriptions');
    const snapshot = await getDocs(subCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllTransactions = async () => {
    const transCol = collection(db, 'transactions');
    const snapshot = await getDocs(transCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteSubscription = async (subscriptionId) => {
    const subRef = doc(db, 'subscriptions', subscriptionId);
    await deleteDoc(subRef);
};

export const updateSubscription = async (subscriptionId, data) => {
    const subRef = doc(db, 'subscriptions', subscriptionId);
    await updateDoc(subRef, data);
};
