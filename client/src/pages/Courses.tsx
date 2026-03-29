import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { BookOpen, Play, Clock, BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";

const difficultyColors: Record<string, string> = {
  beginner: "text-green-400 border-green-400/30",
  intermediate: "text-yellow-400 border-yellow-400/30",
  advanced: "text-red-400 border-red-400/30",
};

export default function Courses() {
  const { data: courses, isLoading } = trpc.course.list.useQuery();
  const [filter, setFilter] = useState<string>("all");

  const categories = useMemo(() => {
    if (!courses) return [];
    const cats = new Set(courses.map((c) => c.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [courses]);

  const filtered = useMemo(() => {
    if (!courses) return [];
    if (filter === "all") return courses;
    return courses.filter((c) => c.category === filter);
  }, [courses, filter]);

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" />
      <div className="glow-orb-1" />
      <div className="glow-orb-2" />
      <Navbar />
      <main className="relative z-10">
        <section className="container pt-20 pb-8">
          <div className="eyebrow mb-3">All Courses</div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">คอร์สทั้งหมด</h1>
          <p className="text-muted-foreground max-w-xl mb-8">
            เลือกคอร์สที่เหมาะกับคุณ เรียนรู้ AI ตั้งแต่พื้นฐานจนถึงระดับสูง
          </p>
          {/* Filters */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setFilter("all")}
                className={`tag transition-colors ${filter === "all" ? "border-purple-400/50 text-purple-400 bg-purple-400/10" : ""}`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`tag transition-colors ${filter === cat ? "border-purple-400/50 text-purple-400 bg-purple-400/10" : ""}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="container pb-16">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass-panel p-6 animate-pulse min-h-[320px]">
                  <div className="h-40 bg-white/5 rounded-xl mb-4" />
                  <div className="h-5 bg-white/10 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-white/10 rounded w-full mb-2" />
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`}>
                  <div className="glass-panel p-6 flex flex-col cursor-pointer group h-full">
                    {course.thumbnailUrl ? (
                      <div className="w-full h-44 rounded-xl overflow-hidden mb-4 bg-white/5">
                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="w-full h-44 rounded-xl mb-4 bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-purple-400/50" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[course.difficulty] || "text-muted-foreground border-white/10"}`}>
                        {course.difficulty}
                      </span>
                      {course.category && <span className="tag text-xs">{course.category}</span>}
                    </div>
                    <h3 className="text-lg font-bold mb-2 leading-tight group-hover:text-purple-400 transition-colors">{course.title}</h3>
                    <p className="text-muted-foreground text-sm flex-1 line-clamp-2">{course.shortDescription || course.description}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.totalLessons} lessons</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.totalDurationMinutes} min</span>
                      </div>
                      <span className="font-bold text-purple-400 text-lg">฿{parseFloat(course.price).toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-2">No Courses Found</h3>
              <p className="text-muted-foreground">ยังไม่มีคอร์สในหมวดนี้</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
