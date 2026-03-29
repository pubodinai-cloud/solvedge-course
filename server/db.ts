import { eq, desc, and, sql, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  courses, InsertCourse,
  lessons, InsertLesson,
  enrollments, InsertEnrollment,
  videoProgress,
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
      enrolledAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
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

  await runSafe(db, "users.openId nullable", sql`ALTER TABLE users MODIFY COLUMN openId varchar(64) NULL`);
  await runSafe(db, "users.passwordHash column", sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordHash varchar(255) NULL`);
  await runSafe(db, "users.stripeCustomerId column", sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripeCustomerId varchar(255) NULL`);
  await runSafe(db, "users.resetToken column", sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS resetToken varchar(255) NULL`);
  await runSafe(db, "users.resetTokenExpiresAt column", sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS resetTokenExpiresAt timestamp NULL`);
  await runSafe(db, "users.email unique index", sql`ALTER TABLE users ADD UNIQUE INDEX IF NOT EXISTS users_email_unique (email)`);

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

  try {
    const values: InsertUser = {
      email: user.email,
      loginMethod: user.loginMethod ?? "email",
      name: user.name ?? null,
      openId: user.openId ?? null,
      passwordHash: user.passwordHash ?? null,
      lastSignedIn: user.lastSignedIn ?? new Date(),
      role:
        user.role ??
        (ENV.ownerEmail && user.email.toLowerCase() === ENV.ownerEmail.toLowerCase()
          ? "admin"
          : "user"),
    };

    const updateSet: Record<string, unknown> = {
      name: values.name,
      loginMethod: values.loginMethod,
      openId: values.openId,
      lastSignedIn: values.lastSignedIn,
      role: values.role,
    };

    if (user.passwordHash !== undefined) {
      updateSet.passwordHash = user.passwordHash ?? null;
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getUserByResetToken(resetToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.resetToken, resetToken)).limit(1);
  return result[0];
}

export async function setPasswordResetToken(userId: number, resetToken: string, resetTokenExpiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ resetToken, resetTokenExpiresAt }).where(eq(users.id, userId));
}

export async function resetPasswordByToken(resetToken: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users)
    .set({ passwordHash, resetToken: null, resetTokenExpiresAt: null })
    .where(eq(users.resetToken, resetToken));
}

export async function createLocalUser(data: { name: string; email: string; passwordHash: string; role?: "user" | "admin" }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(users).values({
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    role:
      data.role ??
      (ENV.ownerEmail && data.email.toLowerCase() === ENV.ownerEmail.toLowerCase() ? "admin" : "user"),
    lastSignedIn: new Date(),
  });

  return result[0].insertId;
}

export async function touchUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function updateUserStripeCustomerId(userId: number, stripeCustomerId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id, name: users.name, email: users.email,
    role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn,
  }).from(users).orderBy(desc(users.createdAt));
}

export async function getAllCourses(publishedOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (publishedOnly) {
    return db.select().from(courses).where(eq(courses.published, true)).orderBy(desc(courses.createdAt));
  }
  return db.select().from(courses).orderBy(desc(courses.createdAt));
}

export async function getCourseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return result[0];
}

export async function getCourseBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
  return result[0];
}

export async function createCourse(data: InsertCourse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(courses).values(data);
  return result[0].insertId;
}

export async function updateCourse(id: number, data: Partial<InsertCourse>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(courses).set(data).where(eq(courses.id, id));
}

export async function deleteCourse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(lessons).where(eq(lessons.courseId, id));
  await db.delete(enrollments).where(eq(enrollments.courseId, id));
  await db.delete(videoProgress).where(eq(videoProgress.courseId, id));
  await db.delete(courses).where(eq(courses.id, id));
}

export async function getLessonsByCourse(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.sortOrder));
}

export async function getLessonById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  return result[0];
}

export async function createLesson(data: InsertLesson) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(lessons).values(data);
  const courseLessons = await getLessonsByCourse(data.courseId);
  const totalDuration = courseLessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
  await db.update(courses).set({
    totalLessons: courseLessons.length,
    totalDurationMinutes: totalDuration,
  }).where(eq(courses.id, data.courseId));
  return result[0].insertId;
}

export async function updateLesson(id: number, data: Partial<InsertLesson>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(lessons).set(data).where(eq(lessons.id, id));
  const lesson = await getLessonById(id);
  if (lesson) {
    const courseLessons = await getLessonsByCourse(lesson.courseId);
    const totalDuration = courseLessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    await db.update(courses).set({
      totalLessons: courseLessons.length,
      totalDurationMinutes: totalDuration,
    }).where(eq(courses.id, lesson.courseId));
  }
}

export async function deleteLesson(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const lesson = await getLessonById(id);
  await db.delete(videoProgress).where(eq(videoProgress.lessonId, id));
  await db.delete(lessons).where(eq(lessons.id, id));
  if (lesson) {
    const courseLessons = await getLessonsByCourse(lesson.courseId);
    const totalDuration = courseLessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    await db.update(courses).set({
      totalLessons: courseLessons.length,
      totalDurationMinutes: totalDuration,
    }).where(eq(courses.id, lesson.courseId));
  }
}

export async function getEnrollmentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: enrollments.id, userId: enrollments.userId, courseId: enrollments.courseId,
    amountPaid: enrollments.amountPaid, currency: enrollments.currency,
    status: enrollments.status, enrolledAt: enrollments.enrolledAt,
    courseTitle: courses.title, courseThumbnail: courses.thumbnailUrl, courseSlug: courses.slug,
  }).from(enrollments)
    .leftJoin(courses, eq(enrollments.courseId, courses.id))
    .where(and(eq(enrollments.userId, userId), eq(enrollments.status, "active")))
    .orderBy(desc(enrollments.enrolledAt));
}

export async function isUserEnrolled(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId), eq(enrollments.status, "active")))
    .limit(1);
  return result.length > 0;
}

export async function createEnrollment(data: InsertEnrollment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(enrollments).values(data);
  return result[0].insertId;
}

export async function getEnrollmentBySessionId(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(enrollments).where(eq(enrollments.stripeSessionId, sessionId)).limit(1);
  return result[0];
}

export async function getAllEnrollments() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: enrollments.id, userId: enrollments.userId, courseId: enrollments.courseId,
    amountPaid: enrollments.amountPaid, currency: enrollments.currency,
    status: enrollments.status, enrolledAt: enrollments.enrolledAt,
    userName: users.name, userEmail: users.email, courseTitle: courses.title,
  }).from(enrollments)
    .leftJoin(users, eq(enrollments.userId, users.id))
    .leftJoin(courses, eq(enrollments.courseId, courses.id))
    .orderBy(desc(enrollments.enrolledAt));
}

export async function getVideoProgress(userId: number, lessonId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videoProgress)
    .where(and(eq(videoProgress.userId, userId), eq(videoProgress.lessonId, lessonId)))
    .limit(1);
  return result[0];
}

export async function getCourseProgress(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videoProgress)
    .where(and(eq(videoProgress.userId, userId), eq(videoProgress.courseId, courseId)));
}

export async function upsertVideoProgress(data: { userId: number; lessonId: number; courseId: number; progressSeconds: number; totalSeconds: number; completed: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getVideoProgress(data.userId, data.lessonId);
  if (existing) {
    await db.update(videoProgress).set({
      progressSeconds: data.progressSeconds,
      totalSeconds: data.totalSeconds,
      completed: data.completed,
      lastWatchedAt: new Date(),
    }).where(eq(videoProgress.id, existing.id));
  } else {
    await db.insert(videoProgress).values({ ...data, lastWatchedAt: new Date() });
  }
}

export async function getSalesStats() {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, totalEnrollments: 0, totalUsers: 0, totalCourses: 0, recentSales: [], monthlySales: [] };

  const [revenueResult] = await db.select({
    total: sql<string>`COALESCE(SUM(${enrollments.amountPaid}), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(enrollments).where(eq(enrollments.status, "active"));

  const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  const [courseCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(courses);

  const recentSales = await db.select({
    id: enrollments.id, amountPaid: enrollments.amountPaid, currency: enrollments.currency,
    enrolledAt: enrollments.enrolledAt, userName: users.name, userEmail: users.email, courseTitle: courses.title,
  }).from(enrollments)
    .leftJoin(users, eq(enrollments.userId, users.id))
    .leftJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.status, "active"))
    .orderBy(desc(enrollments.enrolledAt)).limit(20);

  const monthlySalesRaw = await db.execute(sql`
    SELECT DATE_FORMAT(enrolledAt, '%Y-%m') as month, COALESCE(SUM(amountPaid), 0) as revenue, COUNT(*) as count
    FROM enrollments WHERE status = 'active'
    GROUP BY DATE_FORMAT(enrolledAt, '%Y-%m')
    ORDER BY month
  `);
  const monthlySales = (monthlySalesRaw[0] as unknown as any[]).map((r: any) => ({ month: r.month, revenue: String(r.revenue), count: Number(r.count) }));

  return {
    totalRevenue: parseFloat(revenueResult?.total || "0"),
    totalEnrollments: revenueResult?.count || 0,
    totalUsers: userCount?.count || 0,
    totalCourses: courseCount?.count || 0,
    recentSales,
    monthlySales,
  };
}
