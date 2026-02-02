import { Timestamp } from 'firebase/firestore';

// Strict normalization for ANY Arabic-Indic strings
export function normalizeDigits(input: string): string {
    return input.replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
}

// Strict locale constants
const LOCALE_DATE = "en-GB"; // Forces DD/MM/YYYY
const LOCALE_NUM = "en-EG";
const INT_OPTS: Intl.NumberFormatOptions & Intl.DateTimeFormatOptions = {
    numberingSystem: "latn"
};

export function formatEgyptDate(date: Date | Timestamp | string | number | null | undefined): string {
    if (!date) return 'DD/MM/YYYY';

    let d: Date;
    if (date instanceof Timestamp) {
        d = date.toDate();
    } else if (typeof date === 'string') {
        d = new Date(date);
    } else if (typeof date === 'number') {
        d = new Date(date);
    } else {
        d = date;
    }

    if (isNaN(d.getTime())) return 'DD/MM/YYYY';

    const formatted = new Intl.DateTimeFormat(LOCALE_DATE, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...INT_OPTS
    }).format(d);

    return normalizeDigits(formatted);
}

export function formatNumber(value: number, options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}) {
    const formatted = new Intl.NumberFormat(LOCALE_NUM, {
        ...options,
        ...INT_OPTS
    }).format(value);

    return normalizeDigits(formatted);
}

export function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-EG", {
        numberingSystem: "latn",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}
