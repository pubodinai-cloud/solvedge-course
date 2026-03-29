import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, Loader2, Save, Search, Video, Eye, ImagePlus, UploadCloud } from "lucide-react";
import { useState, useEffect, useMemo, ChangeEvent } from "react";
import { toast } from "sonner";
import { useRoute, Link } from "wouter";

type LessonForm = { title: string; description: string; videoUrl: string; thumbnailUrl: string; durationMinutes: number; sortOrder: number; isFreePreview: boolean };
const emptyLesson: LessonForm = { title: "", description: "", videoUrl: "", thumbnailUrl: "", durationMinutes: 0, sortOrder: 0, isFreePreview: false };

export default function AdminCourseEdit() {
  const [, params] = useRoute("/admin/courses/:id");
  const courseId = parseInt(params?.id || "0");
  const utils = trpc.useUtils();
  const { data: course, isLoading } = trpc.course.byId.useQuery({ id: courseId }, { enabled: !!courseId });
  const { data: adminLessons } = trpc.admin.lessons.list.useQuery({ courseId }, { enabled: !!courseId });
  const [lessonQuery, setLessonQuery] = useState("");
  const [lessonFilter, setLessonFilter] = useState<"all" | "free" | "locked">("all");
  const uploadImage = trpc.admin.uploads.image.useMutation();

  const [form, setForm] = useState({ title: "", slug: "", description: "", shortDescription: "", thumbnailUrl: "", price: "3900.00", difficulty: "beginner" as "beginner" | "intermediate" | "advanced", category: "", published: false });
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  useEffect(() => {
    if (course) setForm({ title: course.title, slug: course.slug, description: course.description || "", shortDescription: course.shortDescription || "", thumbnailUrl: course.thumbnailUrl || "", price: course.price, difficulty: course.difficulty, category: course.category || "", published: course.published });
  }, [course]);

  const updateCourse = trpc.admin.courses.update.useMutation({ onSuccess: () => { utils.course.byId.invalidate({ id: courseId }); utils.admin.courses.list.invalidate(); toast.success("Course updated"); }, onError: (e) => toast.error(e.message) });
  const reorderLessons = trpc.admin.lessons.reorder.useMutation({ onSuccess: () => { utils.admin.lessons.list.invalidate({ courseId }); utils.course.byId.invalidate({ id: courseId }); toast.success("Lesson order updated"); }, onError: (e) => toast.error(e.message) });
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLesson);
  const [draggingLessonId, setDraggingLessonId] = useState<number | null>(null);
  const [lessonThumbnailUploading, setLessonThumbnailUploading] = useState(false);

  const createLesson = trpc.admin.lessons.create.useMutation({ onSuccess: () => { utils.admin.lessons.list.invalidate({ courseId }); utils.course.byId.invalidate({ id: courseId }); setShowLessonDialog(false); setLessonForm(emptyLesson); toast.success("Lesson created"); }, onError: (e) => toast.error(e.message) });
  const updateLesson = trpc.admin.lessons.update.useMutation({ onSuccess: () => { utils.admin.lessons.list.invalidate({ courseId }); utils.course.byId.invalidate({ id: courseId }); setShowLessonDialog(false); setEditingLessonId(null); setLessonForm(emptyLesson); toast.success("Lesson updated"); }, onError: (e) => toast.error(e.message) });
  const deleteLesson = trpc.admin.lessons.delete.useMutation({ onSuccess: () => { utils.admin.lessons.list.invalidate({ courseId }); utils.course.byId.invalidate({ id: courseId }); toast.success("Lesson deleted"); }, onError: (e) => toast.error(e.message) });

  function openEditLesson(lesson: any) {
    setEditingLessonId(lesson.id);
    setLessonForm({ title: lesson.title, description: lesson.description || "", videoUrl: lesson.videoUrl || "", thumbnailUrl: lesson.thumbnailUrl || "", durationMinutes: lesson.durationMinutes, sortOrder: lesson.sortOrder, isFreePreview: lesson.isFreePreview });
    setShowLessonDialog(true);
  }
  function handleSaveLesson() {
    if (editingLessonId) updateLesson.mutate({ id: editingLessonId, ...lessonForm });
    else createLesson.mutate({ courseId, ...lessonForm });
  }

  const filteredLessons = useMemo(() => {
    const q = lessonQuery.trim().toLowerCase();
    return (adminLessons || []).filter((lesson) => {
      const matchQuery = !q || [lesson.title, lesson.description || "", lesson.videoUrl || ""].some((v) => v.toLowerCase().includes(q));
      const matchFilter = lessonFilter === "all" || (lessonFilter === "free" ? lesson.isFreePreview : !lesson.isFreePreview);
      return matchQuery && matchFilter;
    });
  }, [adminLessons, lessonQuery, lessonFilter]);

  const lessonStats = useMemo(() => ({ total: adminLessons?.length || 0, free: (adminLessons || []).filter((l) => l.isFreePreview).length, withVideo: (adminLessons || []).filter((l) => !!l.videoUrl).length }), [adminLessons]);

  async function fileToDataUrl(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleCourseThumbnailFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    setThumbnailUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const result = await uploadImage.mutateAsync({ dataUrl, folder: "courses" });
      setForm((prev) => ({ ...prev, thumbnailUrl: result.url }));
      toast.success("Course thumbnail uploaded");
    } catch (e: any) { toast.error(e.message || "Upload failed"); }
    finally { setThumbnailUploading(false); event.target.value = ""; }
  }

  async function handleLessonThumbnailFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    setLessonThumbnailUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const result = await uploadImage.mutateAsync({ dataUrl, folder: "lessons" });
      setLessonForm((prev) => ({ ...prev, thumbnailUrl: result.url }));
      toast.success("Lesson thumbnail uploaded");
    } catch (e: any) { toast.error(e.message || "Upload failed"); }
    finally { setLessonThumbnailUploading(false); event.target.value = ""; }
  }

  function moveLesson(targetId: number) {
    if (!draggingLessonId || !adminLessons) return;
    if (draggingLessonId === targetId) return;
    const list = [...adminLessons];
    const fromIndex = list.findIndex((lesson) => lesson.id === draggingLessonId);
    const toIndex = list.findIndex((lesson) => lesson.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    reorderLessons.mutate({ courseId, lessonIds: list.map((lesson) => lesson.id) });
  }

  if (isLoading) return <AdminLayout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AdminLayout>;

  return <AdminLayout>
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Link href="/admin/courses"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" /> Back</Button></Link><div className="flex-1"><h1 className="text-2xl font-bold">Edit Course</h1><p className="text-muted-foreground text-sm mt-1">{form.title}</p></div></div>
      <Card>
        <CardHeader><CardTitle>Course Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-sm font-medium mb-1 block">Title</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div><div><label className="text-sm font-medium mb-1 block">Slug</label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div></div>
              <div><label className="text-sm font-medium mb-1 block">Short Description</label><Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></div>
              <div><label className="text-sm font-medium mb-1 block">Full Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full min-h-[100px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="text-sm font-medium mb-1 block">Price (THB)</label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div><div><label className="text-sm font-medium mb-1 block">Difficulty</label><Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select></div><div><label className="text-sm font-medium mb-1 block">Category</label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div></div>
              <div className="flex items-center gap-3"><Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /><label className="text-sm font-medium">{form.published ? "Published" : "Draft"}</label></div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium block">Thumbnail Preview</label>
              <div className="rounded-2xl border border-dashed border-white/15 p-4 bg-white/5">
                <div className="aspect-video overflow-hidden rounded-xl bg-black/20 flex items-center justify-center">
                  {form.thumbnailUrl ? <img src={form.thumbnailUrl} alt={form.title || "Course thumbnail"} className="w-full h-full object-cover" /> : <div className="text-center text-muted-foreground text-sm px-6"><ImagePlus className="h-8 w-8 mx-auto mb-2" />No thumbnail yet</div>}
                </div>
                <div className="mt-3 space-y-3">
                  <Input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="https://..." />
                  <label className="inline-flex items-center gap-2 text-sm rounded-lg border border-white/10 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"><UploadCloud className="h-4 w-4" /> {thumbnailUploading ? "Uploading..." : "Upload image"}<input type="file" accept="image/*" className="hidden" onChange={handleCourseThumbnailFile} disabled={thumbnailUploading} /></label>
                </div>
              </div>
            </div>
          </div>
          <Button onClick={() => updateCourse.mutate({ id: courseId, ...form })} disabled={updateCourse.isPending} className="gap-2">{updateCourse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes</Button>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Lessons</div><div className="text-2xl font-bold mt-1">{lessonStats.total}</div></CardContent></Card><Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Free Preview</div><div className="text-2xl font-bold mt-1 text-green-400">{lessonStats.free}</div></CardContent></Card><Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">With Video URL</div><div className="text-2xl font-bold mt-1 text-cyan-400">{lessonStats.withVideo}</div></CardContent></Card></div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Lessons ({adminLessons?.length || 0})</CardTitle><Button size="sm" onClick={() => { setEditingLessonId(null); setLessonForm({ ...emptyLesson, sortOrder: (adminLessons?.length || 0) + 1 }); setShowLessonDialog(true); }} className="gap-1"><Plus className="h-4 w-4" /> Add Lesson</Button></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between"><div className="relative flex-1 max-w-xl"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={lessonQuery} onChange={(e) => setLessonQuery(e.target.value)} placeholder="ค้นหาชื่อบทเรียน คำอธิบาย หรือ video URL" className="pl-9" /></div><div className="w-full md:w-52"><Select value={lessonFilter} onValueChange={(v) => setLessonFilter(v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">ทั้งหมด</SelectItem><SelectItem value="free">Free preview</SelectItem><SelectItem value="locked">Members only</SelectItem></SelectContent></Select></div></div>
          {filteredLessons.length > 0 ? <div className="space-y-2"><p className="text-xs text-muted-foreground">ลากและวางเพื่อจัดลำดับบทเรียนใหม่</p>{filteredLessons.map((lesson, idx) => <div key={lesson.id} draggable={lessonFilter === "all" && !lessonQuery} onDragStart={() => setDraggingLessonId(lesson.id)} onDragEnd={() => setDraggingLessonId(null)} onDragOver={(e) => e.preventDefault()} onDrop={() => moveLesson(lesson.id)} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${draggingLessonId === lesson.id ? "border-primary bg-primary/5" : "border-white/10 hover:bg-white/5"}`}><GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab" /><span className="text-sm text-muted-foreground w-6">{idx + 1}</span>{lesson.thumbnailUrl ? <img src={lesson.thumbnailUrl} alt={lesson.title} className="h-14 w-24 rounded-lg object-cover bg-white/5" /> : <div className="h-14 w-24 rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-muted-foreground"><ImagePlus className="h-4 w-4" /></div>}<div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="font-medium text-sm truncate">{lesson.title}</span>{lesson.isFreePreview && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-400/20 text-green-400 font-bold inline-flex items-center gap-1"><Eye className="h-3 w-3" /> FREE</span>}{lesson.videoUrl && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-bold inline-flex items-center gap-1"><Video className="h-3 w-3" /> VIDEO</span>}</div><div className="text-xs text-muted-foreground">{lesson.durationMinutes} min • sort {lesson.sortOrder}</div>{lesson.description && <div className="text-xs text-muted-foreground/80 truncate mt-1">{lesson.description}</div>}</div><div className="flex items-center gap-1 flex-shrink-0"><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditLesson(lesson)}><Pencil className="h-3.5 w-3.5" /></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Lesson</AlertDialogTitle><AlertDialogDescription>Delete "{lesson.title}"? This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteLesson.mutate({ id: lesson.id })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div>)}</div> : <p className="text-muted-foreground text-center py-8">No lessons found</p>}
        </CardContent>
      </Card>
    </div>

    <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
      <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingLessonId ? "Edit Lesson" : "Add Lesson"}</DialogTitle></DialogHeader><div className="space-y-4"><div><label className="text-sm font-medium mb-1 block">Title</label><Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Lesson title" /></div><div><label className="text-sm font-medium mb-1 block">Description</label><Input value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} placeholder="Brief description" /></div><div><label className="text-sm font-medium mb-1 block">Video URL</label><Input value={lessonForm.videoUrl} onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} placeholder="https://..." /></div><div><label className="text-sm font-medium mb-1 block">Lesson thumbnail</label><div className="rounded-xl border border-dashed border-white/15 p-3 bg-white/5 space-y-3">{lessonForm.thumbnailUrl ? <img src={lessonForm.thumbnailUrl} alt={lessonForm.title || "Lesson thumbnail"} className="h-40 w-full rounded-lg object-cover" /> : <div className="h-40 w-full rounded-lg bg-black/20 flex items-center justify-center text-muted-foreground"><ImagePlus className="h-8 w-8" /></div>}<Input value={lessonForm.thumbnailUrl} onChange={(e) => setLessonForm({ ...lessonForm, thumbnailUrl: e.target.value })} placeholder="https://..." /><label className="inline-flex items-center gap-2 text-sm rounded-lg border border-white/10 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"><UploadCloud className="h-4 w-4" /> {lessonThumbnailUploading ? "Uploading..." : "Upload image"}<input type="file" accept="image/*" className="hidden" onChange={handleLessonThumbnailFile} disabled={lessonThumbnailUploading} /></label></div></div><div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium mb-1 block">Duration (min)</label><Input type="number" value={lessonForm.durationMinutes} onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: parseInt(e.target.value) || 0 })} /></div><div><label className="text-sm font-medium mb-1 block">Sort Order</label><Input type="number" value={lessonForm.sortOrder} onChange={(e) => setLessonForm({ ...lessonForm, sortOrder: parseInt(e.target.value) || 0 })} /></div></div><div className="flex items-center gap-3"><Switch checked={lessonForm.isFreePreview} onCheckedChange={(v) => setLessonForm({ ...lessonForm, isFreePreview: v })} /><label className="text-sm font-medium">Free Preview</label></div></div><DialogFooter><Button variant="outline" onClick={() => setShowLessonDialog(false)}>Cancel</Button><Button onClick={handleSaveLesson} disabled={createLesson.isPending || updateLesson.isPending || !lessonForm.title}>{(createLesson.isPending || updateLesson.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}{editingLessonId ? "Save" : "Create"}</Button></DialogFooter></DialogContent>
    </Dialog>
  </AdminLayout>;
}
