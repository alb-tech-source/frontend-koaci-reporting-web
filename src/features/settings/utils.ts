// Aturan password mengikuti passwordSchema di backend (auth.validation.ts)
export const passwordRules: { label: string; test: (password: string) => boolean }[] = [
  { label: "8–50 karakter", test: (p) => p.length >= 8 && p.length <= 50 },
  { label: "Mengandung huruf besar (A–Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "Mengandung angka (0–9)", test: (p) => /[0-9]/.test(p) },
];

export const isStrongPassword = (password: string) =>
  passwordRules.every((rule) => rule.test(password));

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (email: string) => EMAIL_PATTERN.test(email.trim());
