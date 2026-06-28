// All user-facing copy lives here. Never hardcode Arabic text in components.
export const ar = {
  app: {
    name: "منصة تعليم القرآن",
  },
  common: {
    save: "حفظ",
    cancel: "إلغاء",
    submit: "إرسال",
    delete: "حذف",
    edit: "تعديل",
    loading: "جارٍ التحميل…",
    retry: "إعادة المحاولة",
  },
  status: {
    pending: "قيد المراجعة",
    draft: "مسودة",
    reviewed: "تمت المراجعة",
  },
  roles: {
    teacher: "معلّم",
    student: "طالب",
  },
  home: {
    welcome: "مرحبًا بك",
    tagline: "سجّل تلاوتك، واحصل على ملاحظات معلّمك",
  },
  demo: {
    componentsTitle: "مكوّنات الواجهة",
    primaryButton: "تسجيل جديد",
    secondaryButton: "انضمام لصف",
    fieldLabel: "اسم المقطع",
    fieldPlaceholder: "مثال: سورة الفاتحة",
    cardTitle: "سورة الفاتحة",
    cardBody: "ثلاث محاولات — آخر حالة: تمت المراجعة",
    tagsTitle: "وسوم الأخطاء الشائعة",
  },
  dev: {
    title: "وضع التطوير",
    signedInAs: "الحساب الحالي",
    switchRole: "تبديل الدور",
  },
  teacherHome: {
    title: "لوحة المعلّم",
    manageClass: "إدارة الصفوف",
    queue: "تسجيلات الطلاب",
    noQueue: "لا توجد تسجيلات بعد",
    by: "الطالب",
  },
  review: {
    title: "مراجعة التلاوة",
    addNote: "إضافة ملاحظة هنا",
    annotations: "الملاحظات",
    noAnnotations: "لا توجد ملاحظات بعد — شغّل التسجيل وأضف ملاحظة",
    submit: "إرسال المراجعة",
    submitted: "تم إرسال المراجعة",
    reopen: "تعديل المراجعة",
    edit: "تعديل",
    delete: "حذف",
    playCorrection: "تشغيل التصحيح الصوتي",
    voiceCorrection: "تصحيح صوتي",
    noClassYet: "تعذّر تحميل التسجيل",
  },
  editor: {
    createTitle: "ملاحظة جديدة",
    editTitle: "تعديل الملاحظة",
    at: "عند",
    commentLabel: "تعليق نصّي",
    commentPlaceholder: "اكتب ملاحظتك هنا…",
    recordVoice: "تسجيل تصحيح صوتي",
    stopVoice: "إيقاف",
    playVoice: "استماع",
    clearVoice: "حذف الصوت",
    voiceAttached: "تم إرفاق تصحيح صوتي",
    voiceRecording: "جارٍ التسجيل…",
    tagsLabel: "الوسوم",
    newTagPlaceholder: "وسم جديد",
    addTag: "إضافة",
    save: "حفظ",
    atLeastOne: "أضف تعليقًا أو صوتًا أو وسمًا واحدًا على الأقل",
  },
  studentHome: {
    title: "لوحة الطالب",
    joinClass: "الانضمام لصف",
    yourClass: "صفّك",
    noClass: "لم تنضم إلى أي صف بعد",
    newRecording: "تسجيل تلاوة جديدة",
    myRecordings: "تسجيلاتي",
    noRecordings: "لا توجد تسجيلات بعد",
  },
  record: {
    title: "تسجيل تلاوة",
    start: "بدء التسجيل",
    stop: "إيقاف",
    rerecord: "إعادة التسجيل",
    play: "استماع",
    pause: "إيقاف مؤقت",
    labelLabel: "اسم المقطع",
    labelPlaceholder: "مثال: سورة الفاتحة",
    upload: "رفع التسجيل",
    uploading: "جارٍ الرفع…",
    needClass: "انضم إلى صف أولاً قبل التسجيل",
    permissionDenied: "نحتاج إذن الميكروفون للتسجيل",
    uploadError: "تعذّر رفع التسجيل، حاول مرة أخرى",
    recording: "جارٍ التسجيل…",
  },
  classes: {
    createTitle: "إنشاء صف جديد",
    nameLabel: "اسم الصف",
    namePlaceholder: "مثال: حلقة تحفيظ الفجر",
    create: "إنشاء",
    joinCode: "رمز الانضمام",
    myClasses: "صفوفي",
    members: "الطلاب",
    noMembers: "لا يوجد طلاب بعد",
    noClasses: "لم تنشئ أي صف بعد",
    joinTitle: "الانضمام إلى صف",
    codeLabel: "رمز الانضمام",
    codePlaceholder: "مثال: QRN-7Y2K",
    join: "انضمام",
    joinedTo: "انضممت إلى",
    errorNotFound: "رمز غير صحيح — لا يوجد صف بهذا الرمز",
    errorGeneric: "تعذّر الانضمام، حاول مرة أخرى",
  },
  setup: {
    needed: "الإعداد مطلوب",
    body: "انسخ ملف ‎.env.example‎ إلى ‎.env‎ وأضف رابط ومفتاح Supabase ثم أعد التشغيل.",
  },
  tagsState: {
    loading: "جارٍ تحميل الوسوم…",
    error: "تعذّر تحميل الوسوم من قاعدة البيانات",
    title: "الوسوم من قاعدة البيانات",
    empty: "لا توجد وسوم بعد",
  },
  tags: {
    madd: "مدّ",
    ghunnah: "غُنّة",
    qalqalah: "قلقلة",
    idgham: "إدغام",
    ikhfa: "إخفاء",
    izhar: "إظهار",
    makhraj: "مخرج الحرف",
    missingWord: "كلمة ناقصة",
    extraWord: "كلمة زائدة",
    waqf: "وقف وابتداء",
    tashkeel: "تشكيل",
  },
} as const;

type Primitive = string;
type Nested = { [key: string]: Primitive | Nested };

/**
 * Resolve a dot-path key against the ar dictionary, e.g. t("status.pending").
 * Returns the key itself if not found (so missing strings are visible, not crashing).
 */
export function t(path: string): string {
  const parts = path.split(".");
  let node: Primitive | Nested = ar as Nested;
  for (const part of parts) {
    if (typeof node === "object" && node !== null && part in node) {
      node = (node as Nested)[part];
    } else {
      return path;
    }
  }
  return typeof node === "string" ? node : path;
}
