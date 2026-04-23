import { z } from "zod";

export interface NIDValidation {
  valid: boolean;
  reason?: string;
}

export interface NIDData {
  birthDate: Date;
  gender: "male" | "female";
  governorateCode: string;
}

// Egyptian NID: 14 digits
// Layout: C YY MM DD GG SSSS X
// C: century digit (2 = 1900s, 3 = 2000s)
// YY MM DD: birth date
// GG: governorate code (2 digits)
// SSSS: serial (4 digits)
// X: check digit (odd=male, even=female)
export function validateNID(nid: string): NIDValidation {
  if (!/^\d{14}$/.test(nid)) {
    return { valid: false, reason: "NID must be exactly 14 digits" };
  }

  const century = parseInt(nid[0], 10);
  if (century !== 2 && century !== 3) {
    return {
      valid: false,
      reason: "First digit must be 2 (1900s) or 3 (2000s)",
    };
  }

  const yy = parseInt(nid.slice(1, 3), 10);
  const mm = parseInt(nid.slice(3, 5), 10);
  const dd = parseInt(nid.slice(5, 7), 10);

  if (mm < 1 || mm > 12) {
    return { valid: false, reason: "Invalid birth month" };
  }
  if (dd < 1 || dd > 31) {
    return { valid: false, reason: "Invalid birth day" };
  }

  const fullYear = century === 2 ? 1900 + yy : 2000 + yy;
  const testDate = new Date(fullYear, mm - 1, dd);
  if (
    testDate.getFullYear() !== fullYear ||
    testDate.getMonth() !== mm - 1 ||
    testDate.getDate() !== dd
  ) {
    return { valid: false, reason: "Invalid birth date" };
  }

  const govCode = nid.slice(7, 9);
  const govNum = parseInt(govCode, 10);
  if (govNum < 1 || govNum > 99) {
    return { valid: false, reason: "Invalid governorate code" };
  }

  return { valid: true };
}

export function extractFromNID(nid: string): NIDData | null {
  const validation = validateNID(nid);
  if (!validation.valid) return null;

  const century = parseInt(nid[0], 10);
  const yy = parseInt(nid.slice(1, 3), 10);
  const mm = parseInt(nid.slice(3, 5), 10);
  const dd = parseInt(nid.slice(5, 7), 10);
  const fullYear = century === 2 ? 1900 + yy : 2000 + yy;

  const birthDate = new Date(fullYear, mm - 1, dd);
  const checkDigit = parseInt(nid[13], 10);
  const gender: "male" | "female" = checkDigit % 2 !== 0 ? "male" : "female";
  const governorateCode = nid.slice(7, 9);

  return { birthDate, gender, governorateCode };
}

// Zod refinement
export const nidSchema = z
  .string()
  .length(14, "NID must be exactly 14 digits")
  .regex(/^\d{14}$/, "NID must contain only digits")
  .refine((val) => validateNID(val).valid, {
    message: "Invalid Egyptian National ID",
  });
