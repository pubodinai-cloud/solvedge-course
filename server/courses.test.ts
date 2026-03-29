import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to create a public (unauthenticated) context
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// Helper to create an authenticated user context
function createUserContext(overrides?: Partial<NonNullable<TrpcContext["user"]>>): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: { origin: "https://test.example.com" } } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// Helper to create an admin context
function createAdminContext(): TrpcContext {
  return createUserContext({ role: "admin", id: 99, openId: "admin-user-123" });
}

describe("course.list", () => {
  it("returns an array of published courses", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const courses = await caller.course.list();
    expect(Array.isArray(courses)).toBe(true);
    // All returned courses should be published
    for (const course of courses) {
      expect(course.published).toBe(true);
    }
  });

  it("each course has required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const courses = await caller.course.list();
    if (courses.length > 0) {
      const course = courses[0];
      expect(course).toHaveProperty("id");
      expect(course).toHaveProperty("title");
      expect(course).toHaveProperty("slug");
      expect(course).toHaveProperty("price");
      expect(course).toHaveProperty("difficulty");
    }
  });
});

describe("course.bySlug", () => {
  it("returns a course with lessons for a valid slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const course = await caller.course.bySlug({ slug: "ai-fundamentals" });
    expect(course).toBeDefined();
    expect(course.title).toBe("AI Fundamentals: From Zero to Hero");
    expect(Array.isArray(course.lessons)).toBe(true);
    expect(course.lessons.length).toBeGreaterThan(0);
  });

  it("throws NOT_FOUND for an invalid slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.course.bySlug({ slug: "nonexistent-course-xyz" })).rejects.toThrow();
  });
});

describe("course.byId", () => {
  it("returns a course with lessons for a valid id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const course = await caller.course.byId({ id: 1 });
    expect(course).toBeDefined();
    expect(course.title).toBeTruthy();
    expect(Array.isArray(course.lessons)).toBe(true);
  });
});

describe("admin.courses.list", () => {
  it("returns all courses (including drafts) for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const courses = await caller.admin.courses.list();
    expect(Array.isArray(courses)).toBe(true);
    expect(courses.length).toBeGreaterThanOrEqual(5);
  });

  it("rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.courses.list()).rejects.toThrow();
  });
});

describe("admin.stats.overview", () => {
  it("returns stats object with expected fields for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.admin.stats.overview();
    expect(stats).toHaveProperty("totalRevenue");
    expect(stats).toHaveProperty("totalEnrollments");
    expect(stats).toHaveProperty("totalUsers");
    expect(stats).toHaveProperty("totalCourses");
    expect(stats).toHaveProperty("recentSales");
    expect(stats).toHaveProperty("monthlySales");
    expect(typeof stats.totalRevenue).toBe("number");
    expect(typeof stats.totalCourses).toBe("number");
    expect(stats.totalCourses).toBeGreaterThanOrEqual(5);
  });
});

describe("admin.members.list", () => {
  it("returns array of users for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const members = await caller.admin.members.list();
    expect(Array.isArray(members)).toBe(true);
  });

  it("rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.members.list()).rejects.toThrow();
  });
});

describe("enrollment.myCourses", () => {
  it("returns array for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const myCourses = await caller.enrollment.myCourses();
    expect(Array.isArray(myCourses)).toBe(true);
  });
});

describe("enrollment.isEnrolled", () => {
  it("returns false for non-enrolled course", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.enrollment.isEnrolled({ courseId: 1 });
    expect(result).toBe(false);
  });
});

describe("progress.getCourseProgress", () => {
  it("returns array for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const progress = await caller.progress.getCourseProgress({ courseId: 1 });
    expect(Array.isArray(progress)).toBe(true);
  });
});
