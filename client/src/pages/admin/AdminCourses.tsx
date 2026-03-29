import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminCourses() {
  const utils = trpc.useUtils();
  const { data: courses, isLoading } = trpc.admin.courses.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [form, setForm] = useState<{ title: string; slug: string; shortDescription: string; price: string; difficulty: "beginner" | "intermediate" | "advanced"; category: string; published: boolean }>({ title: "", slug: "", shortDescription: "", price: "3900.00", difficulty: "beginner", category: "", published: false });

  const createMutation = trpc.admin.courses.create.useMutation({
    onSuccess: () => { utils.admin.courses.list.invalidate(); setShowCreate(false); resetForm(); toast.success("Course created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.courses.delete.useMutation({
    onSuccess: () => { utils.admin.courses.list.invalidate(); toast.success("Course deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const togglePublish = trpc.admin.courses.update.useMutation({
    onSuccess: () => { utils.admin.courses.list.invalidate(); toast.success("Updated"); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() { setForm({ title: "", slug: "", shortDescription: "", price: "3900.00", difficulty: "beginner", category: "", published: false }); }

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9\u0E00-\u0E7F]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "course";
  }

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (courses || []).filter((course) => {
      const matchQuery = !q || [course.title, course.slug, course.category || "", course.shortDescription || ""].some((v) => v.toLowerCase().includes(q));
      const matchStatus = statusFilter === "all" || (statusFilter === "published" ? course.published : !course.published);
      return matchQuery && matchStatus;
    });
  }, [courses, query, statusFilter]);

  const stats = useMemo(() => ({
    total: courses?.length || 0,
    published: (courses || []).filter((c) => c.published).length,
    draft: (courses || []).filter((c) => !c.published).length,
  }), [courses]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Courses</h1>
            <p className="text-muted-foreground text-sm mt-1">จัดการคอร์สทั้งหมด เพิ่ม แก้ไข และ publish ได้จากหน้านี้</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Course</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Total Courses</div><div className="text-2xl font-bold mt-1">{stats.total}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Published</div><div className="text-2xl font-bold mt-1 text-green-400">{stats.published}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Draft</div><div className="text-2xl font-bold mt-1 text-yellow-400">{stats.draft}</div></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาชื่อคอร์ส slug หรือหมวดหมู่" className="pl-9" />
            </div>
            <div className="w-full md:w-52">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Title</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Category</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Difficulty</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">Price</th>
                      <th className="text-center py-3 px-4 text-muted-foreground font-medium">Lessons</th>
                      <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.length > 0 ? filteredCourses.map((course) => (
                      <tr key={course.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium">{course.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">/{course.slug}</div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{course.category || "-"}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            course.difficulty === "beginner" ? "text-green-400 border-green-400/30" :
                            course.difficulty === "intermediate" ? "text-yellow-400 border-yellow-400/30" :
                            "text-red-400 border-red-400/30"
                          }`}>{course.difficulty}</span>
                        </td>
                        <td className="py-3 px-4 text-right">฿{parseFloat(course.price).toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">{course.totalLessons}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => togglePublish.mutate({ id: course.id, published: !course.published })}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                              course.published ? "text-green-400 border-green-400/30 bg-green-400/10" : "text-muted-foreground border-white/10"
                            }`}
                          >
                            {course.published ? <><Eye className="h-3 w-3" /> Published</> : <><EyeOff className="h-3 w-3" /> Draft</>}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/courses/${course.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Course</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete "{course.title}" and all its lessons. This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate({ id: course.id })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">ไม่พบคอร์สตามเงื่อนไขที่ค้นหา</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create New Course</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })} placeholder="e.g. AI Fundamentals" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Slug</label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="ai-fundamentals" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Short Description</label>
              <Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} placeholder="Brief course description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Price (THB)</label>
                <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="3900.00" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Difficulty</label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v as "beginner" | "intermediate" | "advanced" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Machine Learning" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.title || !form.slug}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
