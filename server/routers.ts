import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { z } from "zod";
import * as db from "./db";
import { createCheckoutSession, getStripe } from "./stripe";
import { sdk } from "./_core/sdk";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  const stored = Buffer.from(key, "hex");
  if (derived.length !== stored.length) return false;
  return timingSafeEqual(derived, stored);
}

async function setAuthCookie(ctx: { req: any; res: any }, user: { id: number; email: string; name: string | null }) {
  const token = await sdk.signSession({
    userId: user.id,
    email: user.email,
    name: user.name || user.email,
  });
  const cookieOptions = getSessionCookieOptions(ctx.req);
  ctx.res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure.input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
    })).mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      const existing = await db.getUserByEmail(email);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email already in use" });

      const userId = await db.createLocalUser({
        name: input.name.trim(),
        email,
        passwordHash: hashPassword(input.password),
      });
      const user = await db.getUserById(userId);
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });

      await setAuthCookie(ctx, user);
      return { success: true, user };
    }),
    login: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
    })).mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      const user = await db.getUserByEmail(email);
      if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }
      await setAuthCookie(ctx, user);
      return { success: true, user };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  course: router({
    list: publicProcedure.query(async () => db.getAllCourses(true)),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const course = await db.getCourseBySlug(input.slug);
      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      const lessons = await db.getLessonsByCourse(course.id);
      return { ...course, lessons };
    }),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const course = await db.getCourseById(input.id);
      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      const lessons = await db.getLessonsByCourse(course.id);
      return { ...course, lessons };
    }),
  }),

  enrollment: router({
    myCourses: protectedProcedure.query(async ({ ctx }) => db.getEnrollmentsByUser(ctx.user.id)),
    isEnrolled: protectedProcedure.input(z.object({ courseId: z.number() })).query(async ({ ctx, input }) => db.isUserEnrolled(ctx.user.id, input.courseId)),
    checkout: protectedProcedure.input(z.object({ courseId: z.number() })).mutation(async ({ ctx, input }) => {
      const enrolled = await db.isUserEnrolled(ctx.user.id, input.courseId);
      if (enrolled) throw new TRPCError({ code: "BAD_REQUEST", message: "Already enrolled in this course" });
      const course = await db.getCourseById(input.courseId);
      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      const origin = ctx.req.headers.origin || `${ctx.req.protocol}://${ctx.req.headers.host}`;
      const priceInSatang = Math.round(parseFloat(course.price) * 100);
      const session = await createCheckoutSession({
        courseId: course.id, courseTitle: course.title, priceInSatang,
        userId: ctx.user.id, userEmail: ctx.user.email || "", userName: ctx.user.name || "",
        origin, courseSlug: course.slug,
      });
      return { checkoutUrl: session.url };
    }),
    verifyPayment: protectedProcedure.input(z.object({ sessionId: z.string() })).query(async ({ ctx, input }) => {
      const existing = await db.getEnrollmentBySessionId(input.sessionId);
      if (existing) return { success: true, courseId: existing.courseId };
      try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);
        if (session.payment_status === "paid" && session.metadata?.user_id === ctx.user.id.toString()) {
          const courseId = parseInt(session.metadata.course_id);
          await db.createEnrollment({
            userId: ctx.user.id, courseId, stripeSessionId: input.sessionId,
            stripePaymentIntentId: session.payment_intent as string,
            amountPaid: (session.amount_total! / 100).toFixed(2),
            currency: session.currency?.toUpperCase() || "THB",
          });
          return { success: true, courseId };
        }
      } catch (e) { console.error("[Payment] Verification failed:", e); }
      return { success: false, courseId: null };
    }),
  }),

  progress: router({
    get: protectedProcedure.input(z.object({ lessonId: z.number() })).query(async ({ ctx, input }) => db.getVideoProgress(ctx.user.id, input.lessonId)),
    getCourseProgress: protectedProcedure.input(z.object({ courseId: z.number() })).query(async ({ ctx, input }) => db.getCourseProgress(ctx.user.id, input.courseId)),
    update: protectedProcedure.input(z.object({
      lessonId: z.number(), courseId: z.number(), progressSeconds: z.number(), totalSeconds: z.number(), completed: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      await db.upsertVideoProgress({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
  }),

  lesson: router({
    get: protectedProcedure.input(z.object({ lessonId: z.number() })).query(async ({ ctx, input }) => {
      const lesson = await db.getLessonById(input.lessonId);
      if (!lesson) throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      if (!lesson.isFreePreview) {
        const enrolled = await db.isUserEnrolled(ctx.user.id, lesson.courseId);
        if (!enrolled) throw new TRPCError({ code: "FORBIDDEN", message: "Purchase required" });
      }
      return lesson;
    }),
  }),

  admin: router({
    courses: router({
      list: adminProcedure.query(async () => db.getAllCourses(false)),
      create: adminProcedure.input(z.object({
        title: z.string().min(1), slug: z.string().min(1), description: z.string().optional(),
        shortDescription: z.string().optional(), thumbnailUrl: z.string().optional(),
        price: z.string().default("3900.00"), currency: z.string().default("THB"),
        published: z.boolean().default(false),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
        category: z.string().optional(),
      })).mutation(async ({ input }) => { const id = await db.createCourse(input); return { id }; }),
      update: adminProcedure.input(z.object({
        id: z.number(), title: z.string().optional(), slug: z.string().optional(),
        description: z.string().optional(), shortDescription: z.string().optional(),
        thumbnailUrl: z.string().optional(), price: z.string().optional(),
        currency: z.string().optional(), published: z.boolean().optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        category: z.string().optional(),
      })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateCourse(id, data); return { success: true }; }),
      delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteCourse(input.id); return { success: true }; }),
    }),
    lessons: router({
      list: adminProcedure.input(z.object({ courseId: z.number() })).query(async ({ input }) => db.getLessonsByCourse(input.courseId)),
      create: adminProcedure.input(z.object({
        courseId: z.number(), title: z.string().min(1), description: z.string().optional(),
        videoUrl: z.string().optional(), thumbnailUrl: z.string().optional(),
        durationMinutes: z.number().default(0), sortOrder: z.number().default(0), isFreePreview: z.boolean().default(false),
      })).mutation(async ({ input }) => { const id = await db.createLesson(input); return { id }; }),
      update: adminProcedure.input(z.object({
        id: z.number(), title: z.string().optional(), description: z.string().optional(),
        videoUrl: z.string().optional(), thumbnailUrl: z.string().optional(),
        durationMinutes: z.number().optional(), sortOrder: z.number().optional(), isFreePreview: z.boolean().optional(),
      })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateLesson(id, data); return { success: true }; }),
      delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteLesson(input.id); return { success: true }; }),
    }),
    members: router({
      list: adminProcedure.query(async () => db.getAllUsers()),
      enrollments: adminProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => db.getEnrollmentsByUser(input.userId)),
    }),
    stats: router({
      overview: adminProcedure.query(async () => db.getSalesStats()),
      allEnrollments: adminProcedure.query(async () => db.getAllEnrollments()),
    }),
  }),
});

export type AppRouter = typeof appRouter;
