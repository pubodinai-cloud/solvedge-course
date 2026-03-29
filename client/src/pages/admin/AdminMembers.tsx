import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Eye, Loader2 } from "lucide-react";
import { useState } from "react";

export default function AdminMembers() {
  const { data: members, isLoading } = trpc.admin.members.list.useQuery();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { data: userEnrollments } = trpc.admin.members.enrollments.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground text-sm mt-1">รายชื่อสมาชิกทั้งหมด ({members?.length || 0} users)</p>
        </div>

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
                    {members && members.length > 0 ? members.map((member) => (
                      <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground">#{member.id}</td>
                        <td className="py-3 px-4 font-medium">{member.name || "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{member.email || "—"}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            member.role === "admin" ? "text-purple-400 border-purple-400/30 bg-purple-400/10" : "text-muted-foreground border-white/10"
                          }`}>{member.role}</span>
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
                      <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No members yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enrollment History Dialog */}
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
            <p className="text-muted-foreground text-center py-6">No purchases yet</p>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
