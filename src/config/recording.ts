// Soft caps on recording length so uploads stay reasonable (spec §10).
// Recording auto-stops when the cap is reached.
export const MAX_RECITATION_MS = 5 * 60 * 1000; // student recitation: 5 min
export const MAX_CORRECTION_MS = 2 * 60 * 1000; // teacher voice correction: 2 min
