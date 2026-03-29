import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Eye, Loader2, Search, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function AdminMembers() {
  const utils = trpc.useUtils();
  const { data: members, isLoading } = trpc.admin.members.list.useQuery();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const { data: userEnrollments } = trpc.admin.members.enrollments.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );

  const updateRole = trpc.admin.members.updateRole.useMutation({
    onSuccess: async () => {
      await utils.admin.members.list.invalidate();
      toast.success("Updated member role");
    },
    onError: (e) => toast.error(e.message),
  });

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (members || []).filter((member) => {
      const matchQuery = !q || [member.name || "", member.email || "", String(member.id)].some((v) => v.toLowerCase().includes(q));
      const matchRole = roleFilter === "all" || member.role === roleFilter;
      return matchQuery && matchRole;
    });
  }, [members, query, roleFilter]);

  const stats = useMemo(() => ({
    total: members?.length || 0,
    admin: (members || []).filter((m) => m.role === "admin").length,
    user: (members || []).filter((m) => m.role === "user").length,
  }), [members]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground text-sm mt-1">รายชื่อสมาชิกทั้งหมด ({members?.length || 0} users)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Total Members</div><div className="text-2xl font-bold mt-1">{stats.total}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Admins</div><div className="text-2xl font-bold mt-1 text-purple-400">{stats.admin}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Users</div><div className="text-2xl font-bold mt-1 text-cyan-400">{stats.user}</div></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาด้วยชื่อ อีเมล หรือ ID" className="pl-9" />
            </div>
            <div className="w-full md:w-52">
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุก role</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
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
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">ID</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                      <th className="text-center py-3 px-4 text-muted-foreground font-medium">Role</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">Joined</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">Last Login</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground">#{member.id}</td>
                        <td className="py-3 px-4 font-medium">{member.name || "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{member.email || "—"}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${
                              member.role === "admin" ? "text-purple-400 border-purple-400/30 bg-purple-400/10" : "text-muted-foreground border-white/10"
                            }`}>{member.role}</span>
                            <Select value={member.role} onValueChange={(value) => updateRole.mutate({ userId: member.id, role: value as "user" | "admin" })}>
                              <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">user</SelectItem>
                                <SelectItem value="admin">admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">{new Date(member.createdAt).toLocaleDateString("th-TH")}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground">{new Date(member.lastSignedIn).toLocaleDateString("th-TH")}</td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedUserId(member.id)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No members found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedUserId} onOpenChange={() => setSelectedUserId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Purchase History</DialogTitle></DialogHeader>
          {userEnrollments && userEnrollments.length > 0 ? (
            <div className="space-y-3">
              {userEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 rounded-xl border border-white/10">
                  <div>
                    <div className="font-medium text-sm">{enrollment.courseTitle || "Unknown Course"}</div>
                    <div className="text-xs text-muted-foreground">{new Date(enrollment.enrolledAt).toLocaleDateString("th-TH")}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">฿{parseFloat(enrollment.amountPaid || "0").toLocaleString()}</div>
                    <div className={`text-xs ${enrollment.status === "active" ? "text-green-400" : "text-muted-foreground"}`}>{enrollment.status}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground space-y-2">
              <Shield className="h-5 w-5 mx-auto opacity-70" />
              <p>No purchases yet</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
