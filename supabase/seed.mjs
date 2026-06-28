// Seed the local Supabase with demo users + one ready-to-test class.
//
// Idempotent: safe to run multiple times. Creates auth users (email confirmed),
// matching `profiles` rows (profiles.id = auth user id, required by RLS), one
// class owned by the first teacher, and enrolls all 8 students in it.
//
// Run AFTER `supabase start`, e.g.:
//   SUPABASE_URL=http://127.0.0.1:54321 \
//   SERVICE_ROLE_KEY=<service_role key from `supabase status`> \
//   node supabase/seed.mjs
//
// All demo passwords are "123456".

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
const PASSWORD = "123456";
const CLASS_NAME = "حلقة الإمام الشاطبي";
const JOIN_CODE = "QRN-QRAN"; // exact code students type to join

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEACHERS = [
  { email: "teacher1@quran.app", full_name: "الأستاذ أحمد" },
  { email: "teacher2@quran.app", full_name: "الأستاذة مريم" },
];
const STUDENTS = [
  { email: "student1@quran.app", full_name: "يوسف" },
  { email: "student2@quran.app", full_name: "فاطمة" },
  { email: "student3@quran.app", full_name: "عمر" },
  { email: "student4@quran.app", full_name: "عائشة" },
  { email: "student5@quran.app", full_name: "خالد" },
  { email: "student6@quran.app", full_name: "زينب" },
  { email: "student7@quran.app", full_name: "بلال" },
  { email: "student8@quran.app", full_name: "سمية" },
];

// Build a map of existing auth users (email -> id), paging through all of them.
async function existingUsers() {
  const map = new Map();
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) map.set(u.email, u.id);
    if (data.users.length < 1000) break;
    page += 1;
  }
  return map;
}

async function ensureUser(email, full_name, role, existing) {
  let id = existing.get(email);
  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw new Error(`createUser ${email}: ${error.message}`);
    id = data.user.id;
    console.log(`+ auth user  ${email}`);
  } else {
    console.log(`= auth user  ${email} (exists)`);
  }
  // Upsert the matching profile (id MUST equal the auth user id for RLS).
  const { error: pErr } = await admin
    .from("profiles")
    .upsert({ id, full_name, role }, { onConflict: "id" });
  if (pErr) throw new Error(`profile ${email}: ${pErr.message}`);
  return id;
}

async function main() {
  const existing = await existingUsers();

  // Remove the two orphan dev profiles from migration 0001 (no auth accounts).
  await admin
    .from("profiles")
    .delete()
    .in("id", [
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    ]);

  const teacherIds = [];
  for (const t of TEACHERS) teacherIds.push(await ensureUser(t.email, t.full_name, "teacher", existing));
  const studentIds = [];
  for (const s of STUDENTS) studentIds.push(await ensureUser(s.email, s.full_name, "student", existing));

  // One class owned by the first teacher, with a fixed join code.
  let { data: cls } = await admin.from("classes").select("id").eq("join_code", JOIN_CODE).maybeSingle();
  if (!cls) {
    const { data, error } = await admin
      .from("classes")
      .insert({ teacher_id: teacherIds[0], name: CLASS_NAME, join_code: JOIN_CODE })
      .select("id")
      .single();
    if (error) throw new Error(`class: ${error.message}`);
    cls = data;
    console.log(`+ class      "${CLASS_NAME}"  join code: ${JOIN_CODE}`);
  } else {
    console.log(`= class      "${CLASS_NAME}" (exists)  join code: ${JOIN_CODE}`);
  }

  // Enroll all 8 students (ignore duplicates via the unique constraint).
  const rows = studentIds.map((student_id) => ({ class_id: cls.id, student_id }));
  const { error: mErr } = await admin
    .from("class_members")
    .upsert(rows, { onConflict: "class_id,student_id", ignoreDuplicates: true });
  if (mErr) throw new Error(`members: ${mErr.message}`);
  console.log(`= enrolled ${studentIds.length} students in the class`);

  console.log("\nSeed complete. All passwords are: " + PASSWORD);
}

main().catch((e) => {
  console.error("\nSEED FAILED:", e.message);
  process.exit(1);
});
