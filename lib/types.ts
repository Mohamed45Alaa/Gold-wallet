import { Timestamp } from "firebase/firestore";

export interface GoldBar {
    id: string;
    weight: number; // in grams
    date: Timestamp; // Purchase Date
    price: number; // Total Purchase Price (EGP)
    manufacturingCost: number; // per gram
    cashback: number; // per gram

    // Derived/Calculated fields (stored for history or calc on fly?)
    // Usually better to store the inputs and calculate outputs.
    // "Net Gold Cost" = (Total Price - (Weight * Manufacturing)) ? 
    // Wait, formula might be: Net Gold Cost = Total Price - (Weight * Manufacturing)
    // Let's stick to storing raw inputs.

    isSold: boolean;
    soldPrice?: number; // Total Selling Price (EGP)
    soldDate?: Timestamp;
}

export interface CashEntry {
    id: string;
    amount: number; // EGP
    description: string;
    date: Timestamp;
}

export interface Settings {
    id: string; // 'global'
    manualGramPrice: number | null;
}
