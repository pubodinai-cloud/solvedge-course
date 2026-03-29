import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, DollarSign, ShoppingCart, Search, Save } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminSales() {
  const utils = trpc.useUtils();
  const { data: stats, isLoading } = trpc.admin.stats.overview.useQuery();
  const { data: allEnrollments } = trpc.admin.stats.allEnrollments.useQuery();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ status: "active", paymentStatus: "paid", refundStatus: "none", adminNote: "", accessExpiresAt: "" });

  const updateEnrollment = trpc.admin.sales.updateEnrollment.useMutation({
    onSuccess: () => {
      utils.admin.stats.overview.invalidate();
      utils.admin.stats.allEnrollments.invalidate();
      toast.success("Order updated");
      setEditing(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const chartData = stats?.monthlySales?.map((m) => ({ month: m.month, revenue: parseFloat(m.revenue || "0"), count: m.count })) || [];
  const courseSales: Record<string, { title: string; count: number; revenue: number }> = {};
  allEnrollments?.forEach((e) => {
    const key = e.courseTitle || "Unknown";
    if (!courseSales[key]) courseSales[key] = { title: key, count: 0, revenue: 0 };
    courseSales[key].count++;
    if (e.status === "active") courseSales[key].revenue += parseFloat(e.amountPaid || "0");
  });
  const courseData = Object.values(courseSales).sort((a, b) => b.revenue - a.revenue);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (allEnrollments || []).filter((e) => !q || [e.userName || "", e.userEmail || "", e.courseTitle || "", e.status, e.paymentStatus, e.refundStatus, e.adminNote || ""].some((v) => v.toLowerCase().includes(q)));
  }, [allEnrollments, query]);

  return <AdminLayout>
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Sales Analytics</h1><p className="text-muted-foreground text-sm mt-1">สถิติยอดขาย พร้อมจัดการสถานะ order / payment / refund รายรายการ</p></div>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle><DollarSign className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">฿{(stats?.totalRevenue || 0).toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Enrollments</CardTitle><ShoppingCart className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.totalEnrollments || 0}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg. per Sale</CardTitle><TrendingUp className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">฿{stats?.totalEnrollments ? Math.round((stats.totalRevenue || 0) / stats.totalEnrollments).toLocaleString() : 0}</div></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader><CardContent>{chartData.length > 0 ? <ResponsiveContainer width="100%" height={300}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} /><YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(v) => `฿${v.toLocaleString()}`} /><Tooltip contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", color: "#fff" }} formatter={(value: number) => [`฿${value.toLocaleString()}`, "Revenue"]} /><Bar dataKey="revenue" fill="oklch(0.55 0.25 285)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="text-muted-foreground text-center py-12">No sales data yet</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Monthly Enrollments</CardTitle></CardHeader><CardContent>{chartData.length > 0 ? <ResponsiveContainer width="100%" height={250}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} /><YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} /><Tooltip contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", color: "#fff" }} formatter={(value: number) => [value, "Enrollments"]} /><Line type="monotone" dataKey="count" stroke="oklch(0.70 0.20 285)" strokeWidth={2} dot={{ fill: "oklch(0.70 0.20 285)", r: 4 }} /></LineChart></ResponsiveContainer> : <p className="text-muted-foreground text-center py-8">No data yet</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Revenue by Course</CardTitle></CardHeader><CardContent>{courseData.length > 0 ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-white/10"><th className="text-left py-3 px-2 text-muted-foreground font-medium">Course</th><th className="text-right py-3 px-2 text-muted-foreground font-medium">Enrollments</th><th className="text-right py-3 px-2 text-muted-foreground font-medium">Revenue</th></tr></thead><tbody>{courseData.map((c) => <tr key={c.title} className="border-b border-white/5 hover:bg-white/5 transition-colors"><td className="py-3 px-2 font-medium">{c.title}</td><td className="py-3 px-2 text-right">{c.count}</td><td className="py-3 px-2 text-right font-medium">฿{c.revenue.toLocaleString()}</td></tr>)}</tbody></table></div> : <p className="text-muted-foreground text-center py-8">No course sales data yet</p>}</CardContent></Card>
        <Card>
          <CardHeader><CardTitle>All Transactions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาลูกค้า คอร์ส สถานะ หรือโน้ต" className="pl-9" /></div>
            {filtered.length > 0 ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-white/10"><th className="text-left py-3 px-2 text-muted-foreground font-medium">User</th><th className="text-left py-3 px-2 text-muted-foreground font-medium">Course</th><th className="text-right py-3 px-2 text-muted-foreground font-medium">Amount</th><th className="text-center py-3 px-2 text-muted-foreground font-medium">Order</th><th className="text-center py-3 px-2 text-muted-foreground font-medium">Payment</th><th className="text-center py-3 px-2 text-muted-foreground font-medium">Refund</th><th className="text-right py-3 px-2 text-muted-foreground font-medium">Access Until</th><th className="text-right py-3 px-2 text-muted-foreground font-medium">Actions</th></tr></thead><tbody>{filtered.map((e) => <tr key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-colors"><td className="py-3 px-2"><div className="font-medium">{e.userName || "Unknown"}</div><div className="text-xs text-muted-foreground">{e.userEmail}</div></td><td className="py-3 px-2">{e.courseTitle}</td><td className="py-3 px-2 text-right font-medium">฿{parseFloat(e.amountPaid || "0").toLocaleString()}</td><td className="py-3 px-2 text-center"><Badge value={e.status} /></td><td className="py-3 px-2 text-center"><Badge value={e.paymentStatus} /></td><td className="py-3 px-2 text-center"><Badge value={e.refundStatus} /></td><td className="py-3 px-2 text-right text-muted-foreground">{e.accessExpiresAt ? new Date(e.accessExpiresAt).toLocaleDateString("th-TH") : "No limit"}</td><td className="py-3 px-2 text-right"><Button variant="ghost" size="sm" onClick={() => { setEditing(e); setForm({ status: e.status, paymentStatus: e.paymentStatus, refundStatus: e.refundStatus, adminNote: e.adminNote || "", accessExpiresAt: e.accessExpiresAt ? new Date(e.accessExpiresAt).toISOString().slice(0, 10) : "" }); }}>Manage</Button></td></tr>)}</tbody></table></div> : <p className="text-muted-foreground text-center py-8">No transactions yet</p>}
          </CardContent>
        </Card>
      </>}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Manage Order #{editing?.id}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 p-4 text-sm"><div className="font-medium">{editing?.courseTitle}</div><div className="text-muted-foreground mt-1">{editing?.userName || "Unknown"} • {editing?.userEmail}</div></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-sm font-medium mb-1 block">Order status</label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">active</SelectItem><SelectItem value="refunded">refunded</SelectItem><SelectItem value="expired">expired</SelectItem></SelectContent></Select></div>
              <div><label className="text-sm font-medium mb-1 block">Payment status</label><Select value={form.paymentStatus} onValueChange={(v) => setForm({ ...form, paymentStatus: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">pending</SelectItem><SelectItem value="paid">paid</SelectItem><SelectItem value="failed">failed</SelectItem><SelectItem value="refunded">refunded</SelectItem><SelectItem value="waived">waived</SelectItem></SelectContent></Select></div>
              <div><label className="text-sm font-medium mb-1 block">Refund status</label><Select value={form.refundStatus} onValueChange={(v) => setForm({ ...form, refundStatus: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">none</SelectItem><SelectItem value="requested">requested</SelectItem><SelectItem value="processing">processing</SelectItem><SelectItem value="refunded">refunded</SelectItem><SelectItem value="rejected">rejected</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">Access expires at</label><Input type="date" value={form.accessExpiresAt} onChange={(e) => setForm({ ...form, accessExpiresAt: e.target.value })} /></div>
              <div className="text-xs text-muted-foreground flex items-end">กำหนดวันหมดอายุสิทธิ์ราย order ได้จากตรงนี้</div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Admin note</label><textarea value={form.adminNote} onChange={(e) => setForm({ ...form, adminNote: e.target.value })} className="w-full min-h-[120px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Internal note about payment, refund decision, manual override, etc." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={() => editing && updateEnrollment.mutate({ id: editing.id, ...form } as any)} disabled={updateEnrollment.isPending} className="gap-2">{updateEnrollment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </AdminLayout>;
}

function Badge({ value }: { value: string }) {
  return <span className="text-xs px-2 py-0.5 rounded-full border border-white/10">{value}</span>;
}
