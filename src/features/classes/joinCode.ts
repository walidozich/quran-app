// Human-friendly join codes, e.g. "QRN-7Y2K". Excludes ambiguous chars (0/O, 1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function genJoinCode(): string {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `QRN-${suffix}`;
}
