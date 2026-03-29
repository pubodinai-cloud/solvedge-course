import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { BookOpen, Play, ArrowRight, Loader2 } from "lucide-react";

export default function MyCourses() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: enrollments, isLoading } = trpc.enrollment.myCourses.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <div className="grid-bg" /><Navbar />
        <div className="container pt-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative">
        <div className="grid-bg" /><Navbar />
        <div className="container pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in to view your courses</h1>
          <a href={getLoginUrl()} className="btn-neon px-6 py-3 inline-flex items-center gap-2">Sign In</a>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" /><div className="glow-orb-1" /><div className="glow-orb-2" />
      <Navbar />
      <main className="relative z-10">
        <section className="container pt-20 pb-16">
          <div className="eyebrow mb-3">My Learning</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-8">คอร์สของฉัน</h1>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="glass-panel p-6 animate-pulse min-h-[200px]">
                  <div className="h-5 bg-white/10 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : enrollments && enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <Link key={enrollment.id} href={`/courses/${enrollment.courseSlug}`}>
                  <div className="glass-panel p-6 flex flex-col cursor-pointer group h-full">
                    {enrollment.courseThumbnail ? (
                      <div className="w-full h-40 rounded-xl overflow-hidden mb-4 bg-white/5">
                        <img src={enrollment.courseThumbnail} alt={enrollment.courseTitle || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="w-full h-40 rounded-xl mb-4 bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-purple-400/50" />
                      </div>
                    )}
                    <h3 className="text-lg font-bold mb-2 group-hover:text-purple-400 transition-colors">{enrollment.courseTitle}</h3>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                      <span className="text-xs text-muted-foreground">
                        Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString("th-TH")}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-purple-400 font-medium">
                        Continue <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-2">No Courses Yet</h3>
              <p className="text-muted-foreground mb-6">คุณยังไม่ได้ลงทะเบียนคอร์สใด ๆ</p>
              <Link href="/courses">
                <span className="btn-neon px-6 py-3 inline-flex items-center gap-2">
                  Browse Courses <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
