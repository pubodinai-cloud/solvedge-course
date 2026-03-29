import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function AdminSales() {
  const { data: stats, isLoading } = trpc.admin.stats.overview.useQuery();
  const { data: allEnrollments } = trpc.admin.stats.allEnrollments.useQuery();

  const chartData = stats?.monthlySales?.map((m) => ({
    month: m.month,
    revenue: parseFloat(m.revenue || "0"),
    count: m.count,
  })) || [];

  // Group by course
  const courseSales: Record<string, { title: string; count: number; revenue: number }> = {};
  allEnrollments?.forEach((e) => {
    const key = e.courseTitle || "Unknown";
    if (!courseSales[key]) courseSales[key] = { title: key, count: 0, revenue: 0 };
    courseSales[key].count++;
    courseSales[key].revenue += parseFloat(e.amountPaid || "0");
  });
  const courseData = Object.values(courseSales).sort((a, b) => b.revenue - a.revenue);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sales Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">สถิติยอดขายและรายได้</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">฿{(stats?.totalRevenue || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrollments</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalEnrollments || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg. per Sale</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ฿{stats?.totalEnrollments ? Math.round((stats.totalRevenue || 0) / stats.totalEnrollments).toLocaleString() : 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Revenue Chart */}
            <Card>
              <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(v) => `฿${v.toLocaleString()}`} />
                      <Tooltip
                        contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", color: "#fff" }}
                        formatter={(value: number) => [`฿${value.toLocaleString()}`, "Revenue"]}
                      />
                      <Bar dataKey="revenue" fill="oklch(0.55 0.25 285)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-12">No sales data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Monthly Enrollments Chart */}
            <Card>
              <CardHeader><CardTitle>Monthly Enrollments</CardTitle></CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", color: "#fff" }}
                        formatter={(value: number) => [value, "Enrollments"]}
                      />
                      <Line type="monotone" dataKey="count" stroke="oklch(0.70 0.20 285)" strokeWidth={2} dot={{ fill: "oklch(0.70 0.20 285)", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Revenue by Course */}
            <Card>
              <CardHeader><CardTitle>Revenue by Course</CardTitle></CardHeader>
              <CardContent>
                {courseData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-2 text-muted-foreground font-medium">Course</th>
                          <th className="text-right py-3 px-2 text-muted-foreground font-medium">Enrollments</th>
                          <th className="text-right py-3 px-2 text-muted-foreground font-medium">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseData.map((c) => (
                          <tr key={c.title} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-2 font-medium">{c.title}</td>
                            <td className="py-3 px-2 text-right">{c.count}</td>
                            <td className="py-3 px-2 text-right font-medium">฿{c.revenue.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No course sales data yet</p>
                )}
              </CardContent>
            </Card>

            {/* All Transactions */}
            <Card>
              <CardHeader><CardTitle>All Transactions</CardTitle></CardHeader>
              <CardContent>
                {allEnrollments && allEnrollments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-2 text-muted-foreground font-medium">User</th>
                          <th className="text-left py-3 px-2 text-muted-foreground font-medium">Course</th>
                          <th className="text-right py-3 px-2 text-muted-foreground font-medium">Amount</th>
                          <th className="text-center py-3 px-2 text-muted-foreground font-medium">Status</th>
                          <th className="text-right py-3 px-2 text-muted-foreground font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allEnrollments.map((e) => (
                          <tr key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-2">
                              <div className="font-medium">{e.userName || "Unknown"}</div>
                              <div className="text-xs text-muted-foreground">{e.userEmail}</div>
                            </td>
                            <td className="py-3 px-2">{e.courseTitle}</td>
                            <td className="py-3 px-2 text-right font-medium">฿{parseFloat(e.amountPaid || "0").toLocaleString()}</td>
                            <td className="py-3 px-2 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                e.status === "active" ? "text-green-400 border-green-400/30" : "text-muted-foreground border-white/10"
                              }`}>{e.status}</span>
                            </td>
                            <td className="py-3 px-2 text-right text-muted-foreground">{new Date(e.enrolledAt).toLocaleDateString("th-TH")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No transactions yet</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
