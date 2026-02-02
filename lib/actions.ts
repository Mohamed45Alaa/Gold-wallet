import { db } from "./firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp, setDoc } from "firebase/firestore";
import { GoldBar, CashEntry } from "./types";

// Gold Actions
export async function addGoldBar(data: Omit<GoldBar, 'id' | 'isSold'>) {
    // Add new bar
    await addDoc(collection(db, 'goldBars'), {
        ...data,
        isSold: false,
        // Ensure numbers
        weight: Number(data.weight),
        price: Number(data.price),
        manufacturingCost: Number(data.manufacturingCost),
        cashback: Number(data.cashback),
    });
}

export async function sellGoldBar(id: string, soldPrice: number, soldDate: Date) {
    const ref = doc(db, 'goldBars', id);
    await updateDoc(ref, {
        isSold: true,
        soldPrice: Number(soldPrice),
        soldDate: Timestamp.fromDate(soldDate)
    });
}

export async function updateGoldBar(userId: string, id: string, data: Partial<GoldBar>) {
    const ref = doc(db, 'users', userId, 'goldBars', id);
    await updateDoc(ref, data);
}

export async function deleteGoldBar(id: string) {
    const ref = doc(db, 'goldBars', id);
    await deleteDoc(ref);
}

// Cash Actions
export async function addCashEntry(data: Omit<CashEntry, 'id'>) {
    await addDoc(collection(db, 'cashEntries'), {
        ...data,
        amount: Number(data.amount)
    });
}

export async function deleteCashEntry(id: string) {
    const ref = doc(db, 'cashEntries', id);
    await deleteDoc(ref);
}

// Settings
export async function updateManualGram(price: number | null) {
    const ref = doc(db, 'settings', 'global');
    // Using set with merge to create if not exists
    await setDoc(ref, { manualGramPrice: price }, { merge: true });
}
