import { supabase } from "../../config/supabase";
import { Profile, Sex } from "../../types/database";

// Person-profiles under an auth account (spec.md §12). Grows in v2 Phase 3
// (picker, CRUD, avatars); for now it covers the sign-up wizard's first profile.

export type NewProfileInput = {
  accountId: string;
  fullName: string;
  sex: Sex;
  birthDate: string; // ISO yyyy-mm-dd
  isTeacher: boolean;
  avatarColor?: string;
};

export async function createProfile(input: NewProfileInput): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      account_id: input.accountId,
      full_name: input.fullName,
      sex: input.sex,
      birth_date: input.birthDate,
      is_teacher: input.isTeacher,
      avatar_color: input.avatarColor ?? "green",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export type ProfilePatch = Partial<{
  full_name: string;
  sex: Sex;
  birth_date: string;
  is_teacher: boolean;
  avatar_color: string;
  whatsapp: string | null;
}>;

export async function updateProfileById(id: string, patch: ProfilePatch): Promise<void> {
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) throw error;
}

/** Hard delete — cascades to the person's classes, recordings and reviews. */
export async function deleteProfileById(id: string): Promise<void> {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw error;
}
