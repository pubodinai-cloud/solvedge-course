import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRoute, Link } from "wouter";
import { ArrowLeft, CheckCircle2, Play, Lock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useEffect, useCallback, useMemo, useState } from "react";

export default function WatchLesson() {
  const [, params] = useRoute("/watch/:courseId/:lessonId");
  const courseId = parseInt(params?.courseId || "0");
  const lessonId = parseInt(params?.lessonId || "0");
  const { isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const { data: course } = trpc.course.byId.useQuery({ id: courseId }, { enabled: !!courseId });
  const { data: lesson, isLoading } = trpc.lesson.get.useQuery({ lessonId }, { enabled: !!lessonId && isAuthenticated });
  const { data: courseProgress } = trpc.progress.getCourseProgress.useQuery({ courseId }, { enabled: !!courseId && isAuthenticated });
  const { data: lessonProgress } = trpc.progress.get.useQuery({ lessonId }, { enabled: !!lessonId && isAuthenticated });

  const updateProgress = trpc.progress.update.useMutation();

  const saveProgress = useCallback((completed = false) => {
    if (!videoRef.current || !lessonId || !courseId) return;
    const video = videoRef.current;
    updateProgress.mutate({
      lessonId, courseId,
      progressSeconds: Math.floor(video.currentTime),
      totalSeconds: Math.floor(video.duration || 0),
      completed: completed || video.currentTime >= video.duration - 2,
    });
  }, [lessonId, courseId, updateProgress]);

  // Restore position
  useEffect(() => {
    if (lessonProgress && videoRef.current && lessonProgress.progressSeconds > 0 && !lessonProgress.completed) {
      videoRef.current.currentTime = lessonProgress.progressSeconds;
    }
  }, [lessonProgress]);

  // Auto-save every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) saveProgress();
    }, 15000);
    return () => clearInterval(interval);
  }, [saveProgress]);

  const currentIdx = useMemo(() => course?.lessons?.findIndex((l) => l.id === lessonId) ?? -1, [course, lessonId]);
  const prevLesson = currentIdx > 0 ? course?.lessons?.[currentIdx - 1] : null;
  const nextLesson = course?.lessons && currentIdx < course.lessons.length - 1 ? course.lessons[currentIdx + 1] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen relative bg-background">
        <Navbar />
        <div className="container pt-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-background">
      <Navbar />
      <main className="relative z-10">
        <div className="container pt-6 pb-16">
          <Link href={`/courses/${course?.slug || ""}`}>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to course
            </span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-3">
              {lesson?.videoUrl ? (
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black mb-4">
                  <video
                    ref={videoRef}
                    src={lesson.videoUrl}
                    controls
                    className="w-full h-full"
                    onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                    onPause={() => saveProgress()}
                    onEnded={() => saveProgress(true)}
                  />
                </div>
              ) : (
                <div className="w-full aspect-video rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <div className="text-center text-muted-foreground">
                    <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No video available for this lesson</p>
                  </div>
                </div>
              )}

              <h1 className="text-2xl font-bold mb-2">{lesson?.title}</h1>
              {lesson?.description && <p className="text-muted-foreground mb-4">{lesson.description}</p>}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                {prevLesson ? (
                  <Link href={`/watch/${courseId}/${prevLesson.id}`}>
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronLeft className="h-4 w-4" /> {prevLesson.title}
                    </span>
                  </Link>
                ) : <span />}
                {nextLesson ? (
                  <Link href={`/watch/${courseId}/${nextLesson.id}`}>
                    <span className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors">
                      {nextLesson.title} <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                ) : <span />}
              </div>
            </div>

            {/* Sidebar: Lessons list */}
            <div className="lg:col-span-1">
              <h3 className="font-bold mb-3 text-sm">Course Content</h3>
              <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
                {course?.lessons?.map((l, idx) => {
                  const prog = courseProgress?.find((p) => p.lessonId === l.id);
                  const isActive = l.id === lessonId;
                  return (
                    <Link key={l.id} href={`/watch/${courseId}/${l.id}`}>
                      <div className={`p-3 rounded-xl flex items-center gap-3 text-sm transition-colors cursor-pointer ${isActive ? "bg-purple-500/15 border border-purple-400/30" : "hover:bg-white/5"}`}>
                        <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                          {prog?.completed ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <span className="text-muted-foreground">{idx + 1}</span>}
                        </div>
                        <span className={`truncate ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>{l.title}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
