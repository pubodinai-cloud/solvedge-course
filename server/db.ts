import { eq, desc, and, sql, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  courses, InsertCourse,
  lessons, InsertLesson,
  enrollments, InsertEnrollment,
  videoProgress,
  siteSettings,
  InsertSiteSettings,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let schemaEnsured = false;

async function runSafe(db: ReturnType<typeof drizzle>, label: string, statement: any) {
  try {
    await db.execute(statement);
  } catch (error) {
    console.warn(`[Database] Schema step skipped: ${label}`, error);
  }
}

async function ensureSchema(db: ReturnType<typeof drizzle>) {
  if (schemaEnsured) return;

  await runSafe(db, "create users table", sql`
    CREATE TABLE IF NOT EXISTS users (
      id int AUTO_INCREMENT PRIMARY KEY,
      openId varchar(64) NULL,
      name text NULL,
      email varchar(320) NOT NULL,
      passwordHash varchar(255) NULL,
      loginMethod varchar(64) NULL DEFAULT 'email',
      role enum('user','admin') NOT NULL DEFAULT 'user',
      stripeCustomerId varchar(255) NULL,
      resetToken varchar(255) NULL,
      resetTokenExpiresAt timestamp NULL,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      lastSignedIn timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY users_email_unique (email),
      UNIQUE KEY users_openId_unique (openId)
    )
  `);

  await runSafe(db, "create courses table", sql`
    CREATE TABLE IF NOT EXISTS courses (
      id int AUTO_INCREMENT PRIMARY KEY,
      title varchar(500) NOT NULL,
      slug varchar(500) NOT NULL,
      description text NULL,
      shortDescription varchar(1000) NULL,
      thumbnailUrl text NULL,
      price decimal(10,2) NOT NULL DEFAULT '3900.00',
      currency varchar(10) NOT NULL DEFAULT 'THB',
      stripePriceId varchar(255) NULL,
      stripeProductId varchar(255) NULL,
      published boolean NOT NULL DEFAULT false,
      totalLessons int NOT NULL DEFAULT 0,
      totalDurationMinutes int NOT NULL DEFAULT 0,
      difficulty enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
      category varchar(255) NULL,
      accessDurationDays int NOT NULL DEFAULT 365,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY courses_slug_unique (slug)
    )
  `);

  await runSafe(db, "create lessons table", sql`
    CREATE TABLE IF NOT EXISTS lessons (
      id int AUTO_INCREMENT PRIMARY KEY,
      courseId int NOT NULL,
      title varchar(500) NOT NULL,
      description text NULL,
      videoUrl text NULL,
      thumbnailUrl text NULL,
      durationMinutes int NOT NULL DEFAULT 0,
      sortOrder int NOT NULL DEFAULT 0,
      isFreePreview boolean NOT NULL DEFAULT false,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await runSafe(db, "create enrollments table", sql`
    CREATE TABLE IF NOT EXISTS enrollments (
      id int AUTO_INCREMENT PRIMARY KEY,
      userId int NOT NULL,
      courseId int NOT NULL,
      stripePaymentIntentId varchar(255) NULL,
      stripeSessionId varchar(255) NULL,
      amountPaid decimal(10,2) NULL,
      currency varchar(10) DEFAULT 'THB',
      status enum('active','refunded','expired') NOT NULL DEFAULT 'active',
      paymentStatus enum('pending','paid','failed','refunded','waived') NOT NULL DEFAULT 'paid',
      refundStatus enum('none','requested','processing','refunded','rejected') NOT NULL DEFAULT 'none',
      adminNote text NULL,
      accessStartAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      accessExpiresAt timestamp NULL,
      enrolledAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await runSafe(db, "create video_progress table", sql`
    CREATE TABLE IF NOT EXISTS video_progress (
      id int AUTO_INCREMENT PRIMARY KEY,
      userId int NOT NULL,
      lessonId int NOT NULL,
      courseId int NOT NULL,
      progressSeconds int NOT NULL DEFAULT 0,
      totalSeconds int NOT NULL DEFAULT 0,
      completed boolean NOT NULL DEFAULT false,
      lastWatchedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runSafe(db, "create site_settings table", sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      id int NOT NULL PRIMARY KEY,
      siteName varchar(255) NOT NULL DEFAULT 'AI Academy',
      siteTagline varchar(500) NOT NULL DEFAULT 'Master AI with precision & confidence',
      supportEmail varchar(320) NOT NULL DEFAULT 'help@aicourse.academy',
      heroEyebrow varchar(255) NOT NULL DEFAULT 'AI Education Platform',
      heroTitle text NULL,
      heroDescription text NULL,
      footerText text NULL,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await runSafe(db, "users.openId nullable", sql`ALTER TABLE users MODIFY COLUMN openId varchar(64) NULL`);
  await runSafe(db, "courses.accessDurationDays column", sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS accessDurationDays int NOT NULL DEFAULT 365`);
  await runSafe(db, "enrollments.accessStartAt column", sql`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS accessStartAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  await runSafe(db, "enrollments.accessExpiresAt column", sql`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS accessExpiresAt timestamp NULL`);
  await runSafe(db, "users.passwordHash column", sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordHash varchar(255) NULL`);
  await runSafe(db, "users.stripeCustomerId column", sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripeCustomerId varchar(255) NULL`);
  await runSafe(db, "users.resetToken column", sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS resetToken varchar(255) NULL`);
  await runSafe(db, "users.resetTokenExpiresAt column", sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS resetTokenExpiresAt timestamp NULL`);
  await runSafe(db, "users.email unique index", sql`ALTER TABLE users ADD UNIQUE INDEX IF NOT EXISTS users_email_unique (email)`);
  await runSafe(db, "enrollments paymentStatus", sql`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS paymentStatus enum('pending','paid','failed','refunded','waived') NOT NULL DEFAULT 'paid'`);
  await runSafe(db, "enrollments refundStatus", sql`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS refundStatus enum('none','requested','processing','refunded','rejected') NOT NULL DEFAULT 'none'`);
  await runSafe(db, "enrollments adminNote", sql`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS adminNote text NULL`);
  await runSafe(db, "enrollments updatedAt", sql`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
  await runSafe(db, "seed site settings", sql`
    INSERT INTO site_settings (id, siteName, siteTagline, supportEmail, heroEyebrow, heroTitle, heroDescription, footerText)
    VALUES (1, 'AI Academy', 'Master AI with precision & confidence', 'help@aicourse.academy', 'AI Education Platform', 'Master AI with\nPrecision & Confidence', 'คอร์สเรียน AI ที่ออกแบบมาเพื่อนักพัฒนาและผู้ที่ต้องการเข้าใจ AI อย่างลึกซึ้ง เรียนรู้จากผู้เชี่ยวชาญ พร้อมวิดีโอคุณภาพสูงและแบบฝึกหัดจริง', 'Master AI with precision. Premium courses designed for the next generation of builders.')
    ON DUPLICATE KEY UPDATE id = id
  `);

  schemaEnsured = true;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
      await ensureSchema(_db);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.email) throw new Error("User email is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values: InsertUser = {
    email: user.email,
    loginMethod: user.loginMethod ?? "email",
    name: user.name ?? null,
    openId: user.openId ?? null,
    passwordHash: user.passwordHash ?? null,
    lastSignedIn: user.lastSignedIn ?? new Date(),
    role: user.role ?? (ENV.ownerEmail && user.email.toLowerCase() === ENV.ownerEmail.toLowerCase() ? "admin" : "user"),
  };
  const updateSet: Record<string, unknown> = {
    name: values.name,
    loginMethod: values.loginMethod,
    openId: values.openId,
    lastSignedIn: values.lastSignedIn,
    role: values.role,
  };
  if (user.passwordHash !== undefined) updateSet.passwordHash = user.passwordHash ?? null;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(users).where(eq(users.id, id)).limit(1))[0]; }
export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0]; }
export async function getUserByEmail(email: string) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(users).where(eq(users.email, email)).limit(1))[0]; }
export async function getUserByResetToken(resetToken: string) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(users).where(eq(users.resetToken, resetToken)).limit(1))[0]; }
export async function setPasswordResetToken(userId: number, resetToken: string, resetTokenExpiresAt: Date) { const db = await getDb(); if (!db) throw new Error("Database not available"); await db.update(users).set({ resetToken, resetTokenExpiresAt }).where(eq(users.id, userId)); }
export async function resetPasswordByToken(resetToken: string, passwordHash: string) { const db = await getDb(); if (!db) throw new Error("Database not available"); await db.update(users).set({ passwordHash, resetToken: null, resetTokenExpiresAt: null }).where(eq(users.resetToken, resetToken)); }

export async function createLocalUser(data: { name: string; email: string; passwordHash: string; role?: "user" | "admin" }) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values({
    name: data.name, email: data.email, passwordHash: data.passwordHash, loginMethod: "email",
    role: data.role ?? (ENV.ownerEmail && data.email.toLowerCase() === ENV.ownerEmail.toLowerCase() ? "admin" : "user"),
    lastSignedIn: new Date(),
  });
  return result[0].insertId;
}

export async function touchUserLastSignedIn(userId: number) { const db = await getDb(); if (!db) return; await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId)); }
export async function updateUserStripeCustomerId(userId: number, stripeCustomerId: string) { const db = await getDb(); if (!db) return; await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId)); }

export async function getAllUsers() {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.createdAt));
}
export async function updateUserRole(userId: number, role: "user" | "admin") { const db = await getDb(); if (!db) throw new Error("Database not available"); await db.update(users).set({ role }).where(eq(users.id, userId)); }

export async function getAllCourses(publishedOnly = false) {
  const db = await getDb(); if (!db) return [];
  return publishedOnly ? db.select().from(courses).where(eq(courses.published, true)).orderBy(desc(courses.createdAt)) : db.select().from(courses).orderBy(desc(courses.createdAt));
}
export async function getCourseById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(courses).where(eq(courses.id, id)).limit(1))[0]; }
export async function getCourseBySlug(slug: string) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(courses).where(eq(courses.slug, slug)).limit(1))[0]; }
export async function createCourse(data: InsertCourse) { const db = await getDb(); if (!db) throw new Error("Database not available"); const result = await db.insert(courses).values(data); return result[0].insertId; }
export async function updateCourse(id: number, data: Partial<InsertCourse>) { const db = await getDb(); if (!db) throw new Error("Database not available"); await db.update(courses).set(data).where(eq(courses.id, id)); }
export async function updateEnrollmentAccess(id: number, data: { status?: "active" | "refunded" | "expired"; accessExpiresAt?: Date | null }) { const db = await getDb(); if (!db) throw new Error("Database not available"); await db.update(enrollments).set(data).where(eq(enrollments.id, id)); }
export async function deleteCourse(id: number) { const db = await getDb(); if (!db) throw new Error("Database not available"); await db.delete(lessons).where(eq(lessons.courseId, id)); await db.delete(enrollments).where(eq(enrollments.courseId, id)); await db.delete(videoProgress).where(eq(videoProgress.courseId, id)); await db.delete(courses).where(eq(courses.id, id)); }

export async function getLessonsByCourse(courseId: number) { const db = await getDb(); if (!db) return []; return db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.sortOrder), asc(lessons.id)); }
export async function getLessonById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(lessons).where(eq(lessons.id, id)).limit(1))[0]; }

async function syncCourseTotals(courseId: number) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const courseLessons = await getLessonsByCourse(courseId);
  const totalDuration = courseLessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
  await db.update(courses).set({ totalLessons: courseLessons.length, totalDurationMinutes: totalDuration }).where(eq(courses.id, courseId));
}

export async function createLesson(data: InsertLesson) { const db = await getDb(); if (!db) throw new Error("Database not available"); const result = await db.insert(lessons).values(data); await syncCourseTotals(data.courseId); return result[0].insertId; }
export async function updateLesson(id: number, data: Partial<InsertLesson>) { const db = await getDb(); if (!db) throw new Error("Database not available"); await db.update(lessons).set(data).where(eq(lessons.id, id)); const lesson = await getLessonById(id); if (lesson) await syncCourseTotals(lesson.courseId); }
export async function reorderLessons(courseId: number, lessonIds: number[]) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  for (let index = 0; index < lessonIds.length; index++) {
    await db.update(lessons).set({ sortOrder: index + 1 }).where(and(eq(lessons.id, lessonIds[index]), eq(lessons.courseId, courseId)));
  }
  await syncCourseTotals(courseId);
}
export async function deleteLesson(id: number) { const db = await getDb(); if (!db) throw new Error("Database not available"); const lesson = await getLessonById(id); await db.delete(videoProgress).where(eq(videoProgress.lessonId, id)); await db.delete(lessons).where(eq(lessons.id, id)); if (lesson) await syncCourseTotals(lesson.courseId); }

export async function getEnrollmentsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select({
    id: enrollments.id, userId: enrollments.userId, courseId: enrollments.courseId,
    amountPaid: enrollments.amountPaid, currency: enrollments.currency, status: enrollments.status,
    paymentStatus: enrollments.paymentStatus, refundStatus: enrollments.refundStatus, adminNote: enrollments.adminNote,
    accessStartAt: enrollments.accessStartAt, accessExpiresAt: enrollments.accessExpiresAt,
    enrolledAt: enrollments.enrolledAt, updatedAt: enrollments.updatedAt,
    courseTitle: courses.title, courseThumbnail: courses.thumbnailUrl, courseSlug: courses.slug,
  }).from(enrollments)
    .leftJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.enrolledAt));
}

export async function isUserEnrolled(userId: number, courseId: number) {
  const db = await getDb(); if (!db) return false;
  const result = await db.select().from(enrollments).where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId), eq(enrollments.status, "active"), sql`${enrollments.accessExpiresAt} IS NULL OR ${enrollments.accessExpiresAt} > NOW()`)).limit(1);
  return result.length > 0;
}

export async function createEnrollment(data: InsertEnrollment) { const db = await getDb(); if (!db) throw new Error("Database not available"); const result = await db.insert(enrollments).values(data); return result[0].insertId; }
export async function getEnrollmentBySessionId(sessionId: string) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(enrollments).where(eq(enrollments.stripeSessionId, sessionId)).limit(1))[0]; }

export async function getAllEnrollments() {
  const db = await getDb(); if (!db) return [];
  return db.select({
    id: enrollments.id, userId: enrollments.userId, courseId: enrollments.courseId,
    amountPaid: enrollments.amountPaid, currency: enrollments.currency, status: enrollments.status,
    paymentStatus: enrollments.paymentStatus, refundStatus: enrollments.refundStatus, adminNote: enrollments.adminNote,
    accessStartAt: enrollments.accessStartAt, accessExpiresAt: enrollments.accessExpiresAt,
    enrolledAt: enrollments.enrolledAt, updatedAt: enrollments.updatedAt,
    userName: users.name, userEmail: users.email, courseTitle: courses.title,
  }).from(enrollments)
    .leftJoin(users, eq(enrollments.userId, users.id))
    .leftJoin(courses, eq(enrollments.courseId, courses.id))
    .orderBy(desc(enrollments.enrolledAt));
}

export async function updateEnrollmentAdmin(id: number, data: { status?: "active" | "refunded" | "expired"; paymentStatus?: "pending" | "paid" | "failed" | "refunded" | "waived"; refundStatus?: "none" | "requested" | "processing" | "refunded" | "rejected"; adminNote?: string | null; accessExpiresAt?: Date | null; }) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(enrollments).set({ ...data, updatedAt: new Date() }).where(eq(enrollments.id, id));
}

export async function getVideoProgress(userId: number, lessonId: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(videoProgress).where(and(eq(videoProgress.userId, userId), eq(videoProgress.lessonId, lessonId))).limit(1))[0]; }
export async function getCourseProgress(userId: number, courseId: number) { const db = await getDb(); if (!db) return []; return db.select().from(videoProgress).where(and(eq(videoProgress.userId, userId), eq(videoProgress.courseId, courseId))); }
export async function upsertVideoProgress(data: { userId: number; lessonId: number; courseId: number; progressSeconds: number; totalSeconds: number; completed: boolean }) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const existing = await getVideoProgress(data.userId, data.lessonId);
  if (existing) {
    await db.update(videoProgress).set({ progressSeconds: data.progressSeconds, totalSeconds: data.totalSeconds, completed: data.completed, lastWatchedAt: new Date() }).where(eq(videoProgress.id, existing.id));
  } else {
    await db.insert(videoProgress).values({ ...data, lastWatchedAt: new Date() });
  }
}

export async function getSiteSettings() {
  const db = await getDb();
  if (!db) {
    return {
      id: 1, siteName: "AI Academy", siteTagline: "Master AI with precision & confidence", supportEmail: "help@aicourse.academy",
      heroEyebrow: "AI Education Platform", heroTitle: "Master AI with\nPrecision & Confidence",
      heroDescription: "คอร์สเรียน AI ที่ออกแบบมาเพื่อนักพัฒนาและผู้ที่ต้องการเข้าใจ AI อย่างลึกซึ้ง เรียนรู้จากผู้เชี่ยวชาญ พร้อมวิดีโอคุณภาพสูงและแบบฝึกหัดจริง",
      footerText: "Master AI with precision. Premium courses designed for the next generation of builders.", updatedAt: new Date(),
    };
  }
  const existing = (await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1))[0];
  if (existing) return existing;
  await db.insert(siteSettings).values({ id: 1 });
  return (await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1))[0]!;
}

export async function updateSiteSettings(data: Partial<InsertSiteSettings>) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.insert(siteSettings).values({ id: 1, ...data }).onDuplicateKeyUpdate({ set: { ...data, updatedAt: new Date() } });
  return getSiteSettings();
}

export async function getSalesStats() {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, totalEnrollments: 0, totalUsers: 0, totalCourses: 0, recentSales: [], monthlySales: [] };
  const [revenueResult] = await db.select({ total: sql<string>`COALESCE(SUM(${enrollments.amountPaid}), 0)`, count: sql<number>`COUNT(*)` }).from(enrollments).where(eq(enrollments.status, "active"));
  const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  const [courseCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(courses);
  const recentSales = await db.select({
    id: enrollments.id, amountPaid: enrollments.amountPaid, currency: enrollments.currency,
    enrolledAt: enrollments.enrolledAt, status: enrollments.status, paymentStatus: enrollments.paymentStatus, refundStatus: enrollments.refundStatus,
    userName: users.name, userEmail: users.email, courseTitle: courses.title,
  }).from(enrollments)
    .leftJoin(users, eq(enrollments.userId, users.id))
    .leftJoin(courses, eq(enrollments.courseId, courses.id))
    .orderBy(desc(enrollments.enrolledAt)).limit(20);
  const monthlySalesRaw = await db.execute(sql`
    SELECT DATE_FORMAT(enrolledAt, '%Y-%m') as month, COALESCE(SUM(CASE WHEN status = 'active' THEN amountPaid ELSE 0 END), 0) as revenue, COUNT(*) as count
    FROM enrollments
    GROUP BY DATE_FORMAT(enrolledAt, '%Y-%m')
    ORDER BY month
  `);
  const monthlySales = (monthlySalesRaw[0] as unknown as any[]).map((r: any) => ({ month: r.month, revenue: String(r.revenue), count: Number(r.count) }));
  return { totalRevenue: parseFloat(revenueResult?.total || "0"), totalEnrollments: revenueResult?.count || 0, totalUsers: userCount?.count || 0, totalCourses: courseCount?.count || 0, recentSales, monthlySales };
}
