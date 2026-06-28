// Seed sample recordings + tagged annotations so the dashboards/charts have data.
// Idempotent: detects its own data (audio_path === SEED_AUDIO) and skips if present.
//
// Run AFTER ./server.sh, e.g.:
//   SUPABASE_URL=http://127.0.0.1:54321 SERVICE_ROLE_KEY=<key> node supabase/seed-demo-data.mjs
//
// NOTE: seeded recordings point at a placeholder audio object (not real
// recitation), so they show up in lists + stats but won't play meaningfully.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
const JOIN_CODE = "QRN-QRAN";
const SEED_AUDIO = "seed/placeholder.m4a";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY.");
  process.exit(1);
}
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// recordings to create: [studentEmail, label, status, [tagNames for annotations]]
const PLAN = [
  ["student1@quran.app", "سورة الفاتحة", "reviewed", ["مدّ", "غُنّة"]],
  ["student1@quran.app", "البقرة ١-٥", "reviewed", ["مدّ", "قلقلة"]],
  ["student2@quran.app", "سورة الإخلاص", "reviewed", ["غُنّة", "إدغام"]],
  ["student2@quran.app", "سورة الناس", "in_review", ["مدّ"]],
  ["student3@quran.app", "سورة الفلق", "reviewed", ["قلقلة", "مدّ"]],
  ["student3@quran.app", "سورة الكوثر", "pending", []],
  ["student4@quran.app", "سورة الماعون", "reviewed", ["إخفاء", "مخرج الحرف"]],
  ["student4@quran.app", "سورة قريش", "in_review", ["غُنّة", "مدّ"]],
  ["student5@quran.app", "سورة الفيل", "pending", []],
  ["student5@quran.app", "سورة الهمزة", "pending", []],
];

async function main() {
  // Resolve class + teacher + students + tags.
  const { data: cls } = await admin.from("classes").select("id, teacher_id").eq("join_code", JOIN_CODE).single();
  if (!cls) throw new Error(`class ${JOIN_CODE} not found — run server.sh first`);

  const { data: already } = await admin
    .from("recordings")
    .select("id")
    .eq("class_id", cls.id)
    .eq("audio_path", SEED_AUDIO)
    .limit(1);
  if (already && already.length > 0) {
    console.log("Demo data already present — skipping.");
    return;
  }

  // Map student email -> profile id (via auth users).
  const { data: usersPage } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailToId = new Map(usersPage.users.map((u) => [u.email, u.id]));

  const { data: tags } = await admin.from("tags").select("id, name");
  const tagByName = new Map((tags ?? []).map((t) => [t.name, t.id]));

  // Ensure a placeholder audio object exists so signed-URL calls resolve.
  await admin.storage
    .from("recordings")
    .upload(SEED_AUDIO, new Uint8Array([0, 0, 0, 0]), { contentType: "audio/m4a", upsert: true });

  let recCount = 0;
  let annCount = 0;
  for (const [email, label, status, tagNames] of PLAN) {
    const studentId = emailToId.get(email);
    if (!studentId) continue;

    const reviewedAt = status === "reviewed" ? new Date().toISOString() : null;
    const { data: rec, error: re } = await admin
      .from("recordings")
      .insert({
        class_id: cls.id,
        student_id: studentId,
        label,
        audio_path: SEED_AUDIO,
        duration_ms: 30000,
        status,
        reviewed_at: reviewedAt,
      })
      .select("id")
      .single();
    if (re) throw new Error(`recording ${label}: ${re.message}`);
    recCount += 1;

    // One annotation per tag, authored by the class teacher.
    let ts = 4000;
    for (const tagName of tagNames) {
      const { data: ann, error: ae } = await admin
        .from("annotations")
        .insert({
          recording_id: rec.id,
          teacher_id: cls.teacher_id,
          timestamp_ms: ts,
          comment_text: `انتبه إلى ${tagName} هنا`,
        })
        .select("id")
        .single();
      if (ae) throw new Error(`annotation: ${ae.message}`);
      const tagId = tagByName.get(tagName);
      if (tagId) {
        await admin.from("annotation_tags").insert({ annotation_id: ann.id, tag_id: tagId });
      }
      annCount += 1;
      ts += 6000;
    }
  }

  console.log(`Seeded ${recCount} recordings and ${annCount} tagged annotations.`);
}

main().catch((e) => {
  console.error("DEMO SEED FAILED:", e.message);
  process.exit(1);
});
