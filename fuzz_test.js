
const fs = require('fs');

// REPLICATED LOGIC FROM ArabicHybridDateInput.tsx
function simulateInput(inputString) {
    // 1. Strip non-digits (Directly from component code)
    let v = inputString.replace(/[^0-9]/g, "");

    // 2. Auto-insert slashes
    if (v.length > 2) {
        v = v.slice(0, 2) + "/" + v.slice(2);
    }
    if (v.length > 5) {
        v = v.slice(0, 5) + "/" + v.slice(5);
    }
    if (v.length > 10) {
        v = v.slice(0, 10);
    }

    // 3. Check for "onChange" trigger
    let outputIso = null;
    if (v.length === 10) {
        const [d, m, y] = v.split("/");
        if (d && m && y && !isNaN(Number(d)) && !isNaN(Number(m)) && !isNaN(Number(y))) {
            outputIso = `${y}-${m}-${d}`;
        }
    }

    return {
        visual: v,
        iso: outputIso
    };
}

// HELPER: strict output validation
function isValidDate(y, m, d) {
    const year = parseInt(y, 10);
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);

    // Basic range checks
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Strict Date object check (handles leap years etc)
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

// HELPER: Generate random string
function randomString(length) {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;':\",./<>?٠١٢٣٤٥٦٧٨٩";
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// SCENARIOS
const TEST_CASES = [];

// 1. Valid Latin Dates
for (let i = 0; i < 1000; i++) {
    const y = 2000 + Math.floor(Math.random() * 50);
    const m = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const d = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    TEST_CASES.push({ input: `${d}${m}${y}`, type: "VALID_LATIN" });
    TEST_CASES.push({ input: `${d}/${m}/${y}`, type: "VALID_LATIN_SLASH" });
}

// 2. Arabic Digits (Should fail with current logic?)
for (let i = 0; i < 1000; i++) {
    const y = "٢٠٢٦";
    const m = "٠١";
    const d = "١٥";
    TEST_CASES.push({ input: `${d}${m}${y}`, type: "ARABIC_DIGITS" });
    TEST_CASES.push({ input: `${d}/${m}/${y}`, type: "ARABIC_DIGITS_SLASH" });
}

// 3. Invalid Logic Dates (Feb 30, Month 13)
TEST_CASES.push({ input: "30022026", type: "INVALID_DATE_LOGIC" }); // Feb 30
TEST_CASES.push({ input: "32012026", type: "INVALID_DATE_LOGIC" }); // Jan 32
TEST_CASES.push({ input: "01132026", type: "INVALID_DATE_LOGIC" }); // Month 13
TEST_CASES.push({ input: "00012026", type: "INVALID_DATE_LOGIC" }); // Day 00
TEST_CASES.push({ input: "01002026", type: "INVALID_DATE_LOGIC" }); // Month 00

// 4. Short Inputs
TEST_CASES.push({ input: "122026", type: "SHORT_INPUT" }); // 1/2/2026 -> 01022026 expected but typing short
TEST_CASES.push({ input: "1/2/2026", type: "SHORT_INPUT_SLASH" });

// 5. Random Fuzz
for (let i = 0; i < 7000; i++) {
    TEST_CASES.push({ input: randomString(Math.floor(Math.random() * 20)), type: "RANDOM_FUZZ" });
}

// EXECUTE
let failures = 0;
let results = [];
let bugCategories = {};

console.log(`Running ${TEST_CASES.length} test cases...`);

TEST_CASES.forEach((tc, idx) => {
    const res = simulateInput(tc.input);
    let failure = false;
    let reason = "";

    // CHECK 1: Arabic Digits Handling
    if (tc.type.includes("ARABIC") && res.visual.length === 0) {
        // If we expect it to work but it stripped everything
        failure = true;
        reason = "SILENT FAILURE: Arabic digits completely stripped";
        if (!bugCategories["ARABIC_STRIPPED"]) bugCategories["ARABIC_STRIPPED"] = 0;
        bugCategories["ARABIC_STRIPPED"]++;
    }

    // CHECK 2: Invalid Date Logic Acceptance
    if (res.iso) {
        const [y, m, d] = res.iso.split("-");
        if (!isValidDate(y, m, d)) {
            failure = true;
            reason = `WRONG DATE ACCEPTED: Component generated impossible date ${res.iso}`;
            if (!bugCategories["IMPOSSIBLE_DATE"]) bugCategories["IMPOSSIBLE_DATE"] = 0;
            bugCategories["IMPOSSIBLE_DATE"]++;
        }
    }

    if (failure) {
        failures++;
        if (results.length < 50) { // Keep log size manageable
            results.push(`[${tc.type}] Input: "${tc.input}" -> Visual: "${res.visual}" ISO: "${res.iso}" | ERROR: ${reason}`);
        }
    }
});

const report = {
    total: TEST_CASES.length,
    failures: failures,
    rate: ((failures / TEST_CASES.length) * 100).toFixed(2) + "%",
    categories: bugCategories,
    samples: results
};

console.log(JSON.stringify(report, null, 2));
