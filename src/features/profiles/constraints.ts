import { Sex } from "../../types/database";

/**
 * Age at which the same-sex teaching guideline applies (spec.md §15).
 * Under it: any teacher. At/over it: an opposite-sex teacher triggers a
 * SOFT warning at class join — never a hard block.
 */
export const ADULT_AGE = 15;

/** Whole years between an ISO birth date and today. */
export function ageOf(birthDateIso: string): number {
  const birth = new Date(birthDateIso);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hadBirthday =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

/** True when joining this teacher's class should show the soft warning. */
export function oppositeSexWarning(
  student: { sex: Sex; birth_date: string },
  teacherSex: Sex
): boolean {
  return ageOf(student.birth_date) >= ADULT_AGE && student.sex !== teacherSex;
}
