import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Zap, BookOpen, Play, ArrowRight } from "lucide-react";

export default function Home() {
  const { data: courses, isLoading } = trpc.course.list.useQuery();
  const { data: settings } = trpc.site.settings.useQuery();
  const heroTitle = settings?.heroTitle || "Master AI with\nPrecision & Confidence";
  const [heroLine1, heroLine2] = heroTitle.split("\n");

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" />
      <div className="glow-orb-1" />
      <div className="glow-orb-2" />
      <Navbar />
      <main className="relative z-10">
        <section className="container pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="eyebrow mb-5">{settings?.heroEyebrow || "AI Education Platform"}</div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] max-w-4xl mb-6">{heroLine1 || "Master AI with"}<br /><span className="bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">{heroLine2 || "Precision & Confidence"}</span></h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-8 leading-relaxed">{settings?.heroDescription || "คอร์สเรียน AI ที่ออกแบบมาเพื่อนักพัฒนาและผู้ที่ต้องการเข้าใจ AI อย่างลึกซึ้ง เรียนรู้จากผู้เชี่ยวชาญ พร้อมวิดีโอคุณภาพสูงและแบบฝึกหัดจริง"}</p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/courses"><span className="btn-neon px-7 py-3 text-base inline-flex items-center gap-2">Browse Courses <ArrowRight className="h-4 w-4" /></span></Link>
            <Link href="/courses"><span className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-white/12 text-foreground hover:bg-white/5 transition-colors text-base font-semibold"><Play className="h-4 w-4" /> Watch Preview</span></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
            <div className="glass-panel p-6"><span className="text-3xl font-bold">AI Fundamentals</span><span className="block mt-2 text-muted-foreground">เข้าใจพื้นฐาน AI ตั้งแต่ต้น</span></div>
            <div className="glass-panel p-6"><span className="text-3xl font-bold">Hands-on Projects</span><span className="block mt-2 text-muted-foreground">ลงมือทำโปรเจกต์จริง</span></div>
            <div className="glass-panel p-6"><span className="text-3xl font-bold">Expert-led</span><span className="block mt-2 text-muted-foreground">สอนโดยผู้เชี่ยวชาญด้าน AI</span></div>
          </div>
        </section>
        <section className="container py-16 md:py-24">
          <div className="flex justify-between items-end mb-10"><div><div className="eyebrow mb-3">Featured Courses</div><h2 className="text-3xl md:text-4xl font-bold">คอร์สยอดนิยม</h2></div><Link href="/courses"><span className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:inline-flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></span></Link></div>
          {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3].map((i) => <div key={i} className="glass-panel p-6 animate-pulse min-h-[280px]"><div className="h-4 bg-white/10 rounded w-20 mb-4" /><div className="h-6 bg-white/10 rounded w-3/4 mb-3" /><div className="h-4 bg-white/10 rounded w-full mb-2" /><div className="h-4 bg-white/10 rounded w-2/3" /></div>)}</div> : courses && courses.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{courses.slice(0, 6).map((course) => <Link key={course.id} href={`/courses/${course.slug}`}><div className="glass-panel p-6 min-h-[280px] flex flex-col cursor-pointer group">{course.thumbnailUrl && <div className="w-full h-40 rounded-xl overflow-hidden mb-4 bg-white/5"><img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /></div>}<div className="eyebrow mb-2">{course.category || course.difficulty}</div><h3 className="text-xl font-bold mb-2 leading-tight">{course.title}</h3><p className="text-muted-foreground text-sm flex-1 line-clamp-2">{course.shortDescription || course.description}</p><div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10"><div className="flex items-center gap-3 text-sm text-muted-foreground"><span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {course.totalLessons} lessons</span><span className="flex items-center gap-1"><Play className="h-3.5 w-3.5" /> {course.totalDurationMinutes} min</span></div><span className="font-bold text-purple-400">฿{parseFloat(course.price).toLocaleString()}</span></div></div></Link>)}</div> : <div className="glass-panel p-12 text-center"><Zap className="h-12 w-12 mx-auto text-purple-400 mb-4" /><h3 className="text-xl font-bold mb-2">Coming Soon</h3><p className="text-muted-foreground">คอร์สใหม่กำลังจะมาเร็ว ๆ นี้</p></div>}
        </section>
        <section className="container py-16 md:py-24"><div className="glass-panel p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8"><div><div className="eyebrow mb-3">Start Learning</div><h2 className="text-2xl md:text-3xl font-bold mb-3">พร้อมที่จะเริ่มเรียน AI แล้วหรือยัง?</h2><p className="text-muted-foreground max-w-lg">เริ่มต้นเส้นทางการเรียนรู้ AI วันนี้ พร้อมคอร์สคุณภาพสูงที่ออกแบบมาเพื่อคุณโดยเฉพาะ</p></div><Link href="/courses"><span className="btn-neon px-8 py-3 text-base inline-flex items-center gap-2 whitespace-nowrap">Explore Courses <ArrowRight className="h-4 w-4" /></span></Link></div></section>
      </main>
      <Footer />
    </div>
  );
}
