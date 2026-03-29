import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, BookOpen, ShoppingCart, Loader2, PlusCircle, FolderCog, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.admin.stats.overview.useQuery();

  const conversionHint = stats?.totalUsers ? Math.round(((stats.totalEnrollments || 0) / stats.totalUsers) * 100) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">ภาพรวมของแพลตฟอร์มและทางลัดสำหรับผู้ดูแลระบบ</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/courses">
              <Button className="gap-2"><PlusCircle className="h-4 w-4" /> เพิ่มคอร์ส</Button>
            </Link>
            <Link href="/admin/sales">
              <Button variant="outline" className="gap-2"><ArrowRight className="h-4 w-4" /> ดูยอดขาย</Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">฿{(stats?.totalRevenue || 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">รายได้รวมจากคำสั่งซื้อทั้งหมด</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Enrollments</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalEnrollments || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">รายการซื้อคอร์สที่ active อยู่</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">อัตราซื้อคอร์สประมาณ {conversionHint}% ของสมาชิก</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">คอร์สทั้งหมดในระบบ</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.recentSales && stats.recentSales.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-2 text-muted-foreground font-medium">User</th>
                            <th className="text-left py-3 px-2 text-muted-foreground font-medium">Course</th>
                            <th className="text-right py-3 px-2 text-muted-foreground font-medium">Amount</th>
                            <th className="text-right py-3 px-2 text-muted-foreground font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentSales.slice(0, 8).map((sale) => (
                            <tr key={sale.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-2">
                                <div className="font-medium">{sale.userName || "Unknown"}</div>
                                <div className="text-xs text-muted-foreground">{sale.userEmail}</div>
                              </td>
                              <td className="py-3 px-2">{sale.courseTitle}</td>
                              <td className="py-3 px-2 text-right font-medium">฿{parseFloat(sale.amountPaid || "0").toLocaleString()}</td>
                              <td className="py-3 px-2 text-right text-muted-foreground">{new Date(sale.enrolledAt).toLocaleDateString("th-TH")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No sales yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/admin/courses">
                    <Button variant="outline" className="w-full justify-between">
                      จัดการคอร์ส <FolderCog className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/admin/members">
                    <Button variant="outline" className="w-full justify-between">
                      ดูสมาชิก <Users className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/admin/sales">
                    <Button variant="outline" className="w-full justify-between">
                      ดูยอดขาย <DollarSign className="h-4 w-4" />
                    </Button>
                  </Link>
                  <div className="rounded-xl border border-white/10 p-4 text-sm text-muted-foreground">
                    คำแนะนำ: เริ่มจากสร้างคอร์สให้ครบก่อน แล้วค่อยเปิด publish เพื่อขายจริง
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
