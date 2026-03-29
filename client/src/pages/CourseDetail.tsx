import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useRoute, Link } from "wouter";
import { BookOpen, Play, Clock, Lock, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:slug");
  const slug = params?.slug || "";
  const { user, isAuthenticated } = useAuth();

  const { data: course, isLoading } = trpc.course.bySlug.useQuery({ slug }, { enabled: !!slug });
  const { data: isEnrolled } = trpc.enrollment.isEnrolled.useQuery(
    { courseId: course?.id ?? 0 },
    { enabled: !!course && isAuthenticated }
  );
  const { data: progress } = trpc.progress.getCourseProgress.useQuery(
    { courseId: course?.id ?? 0 },
    { enabled: !!course && !!isEnrolled }
  );

  const checkoutMutation = trpc.enrollment.checkout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info("Redirecting to checkout...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const completedLessons = progress?.filter((p) => p.completed).length || 0;
  const totalLessons = course?.lessons?.length || 0;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="grid-bg" /><Navbar />
        <div className="container pt-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen relative">
        <div className="grid-bg" /><Navbar />
        <div className="container pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <Link href="/courses"><span className="text-purple-400 hover:underline">Back to courses</span></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" /><div className="glow-orb-1" /><div className="glow-orb-2" />
      <Navbar />
      <main className="relative z-10">
        <section className="container pt-20 pb-8">
          <Link href="/courses">
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to courses
            </span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
            {/* Left: Course Info */}
            <div className="lg:col-span-2">
              {course.thumbnailUrl && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden mb-6 bg-white/5">
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <span className="tag text-xs">{course.difficulty}</span>
                {course.category && <span className="tag text-xs">{course.category}</span>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-muted-foreground leading-relaxed mb-6">{course.description || course.shortDescription}</p>

              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {course.totalLessons} lessons</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {course.totalDurationMinutes} min total</span>
              </div>

              {/* Progress bar for enrolled users */}
              {isEnrolled && (
                <div className="glass-panel p-4 mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Your Progress</span>
                    <span className="text-sm text-purple-400 font-bold">{progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{completedLessons} / {totalLessons} lessons completed</p>
                </div>
              )}

              {/* Lessons List */}
              <h2 className="text-xl font-bold mb-4">Course Content</h2>
              <div className="space-y-2">
                {course.lessons?.map((lesson, idx) => {
                  const lessonProgress = progress?.find((p) => p.lessonId === lesson.id);
                  const canWatch = isEnrolled || lesson.isFreePreview;
                  return (
                    <div key={lesson.id} className={`glass-panel p-4 flex items-center gap-4 ${canWatch ? "cursor-pointer hover:border-purple-400/30" : "opacity-70"}`}
                      onClick={() => { if (canWatch && isAuthenticated) window.location.href = `/watch/${course.id}/${lesson.id}`; }}>
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-sm font-bold">
                        {lessonProgress?.completed ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{lesson.title}</span>
                          {lesson.isFreePreview && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-400/20 text-green-400 font-bold">FREE</span>}
                        </div>
                        {lesson.description && <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                        <span>{lesson.durationMinutes} min</span>
                        {canWatch ? <Play className="h-4 w-4 text-purple-400" /> : <Lock className="h-4 w-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Purchase Card */}
            <div className="lg:col-span-1">
              <div className="glass-panel p-6 sticky top-24">
                <div className="text-3xl font-bold text-purple-400 mb-2">฿{parseFloat(course.price).toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mb-6">{course.currency}</p>

                {isEnrolled ? (
                  <div>
                    <div className="btn-neon w-full py-3 text-center mb-3 cursor-pointer"
                      onClick={() => {
                        const firstIncomplete = course.lessons?.find((l) => !progress?.find((p) => p.lessonId === l.id && p.completed));
                        const lessonId = firstIncomplete?.id || course.lessons?.[0]?.id;
                        if (lessonId) window.location.href = `/watch/${course.id}/${lessonId}`;
                      }}>
                      <span className="flex items-center justify-center gap-2"><Play className="h-4 w-4" /> Continue Learning</span>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">You have access to this course</p>
                  </div>
                ) : isAuthenticated ? (
                  <button
                    className="btn-neon w-full py-3 text-center disabled:opacity-50"
                    disabled={checkoutMutation.isPending}
                    onClick={() => checkoutMutation.mutate({ courseId: course.id })}
                  >
                    {checkoutMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing...</span>
                    ) : (
                      "Buy Now"
                    )}
                  </button>
                ) : (
                  <a href={getLoginUrl()} className="btn-neon w-full py-3 text-center block">
                    Sign in to Purchase
                  </a>
                )}

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Lessons</span><span className="text-foreground font-medium">{course.totalLessons}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Duration</span><span className="text-foreground font-medium">{course.totalDurationMinutes} min</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Level</span><span className="text-foreground font-medium capitalize">{course.difficulty}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Access</span><span className="text-foreground font-medium">{course.accessDurationDays} days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
