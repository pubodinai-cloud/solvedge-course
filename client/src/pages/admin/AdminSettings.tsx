import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminSettings() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.settings.get.useQuery();
  const [form, setForm] = useState({
    siteName: "", siteTagline: "", supportEmail: "", heroEyebrow: "", heroTitle: "", heroDescription: "", footerText: "",
  });

  useEffect(() => {
    if (data) setForm({
      siteName: data.siteName || "", siteTagline: data.siteTagline || "", supportEmail: data.supportEmail || "", heroEyebrow: data.heroEyebrow || "",
      heroTitle: data.heroTitle || "", heroDescription: data.heroDescription || "", footerText: data.footerText || "",
    });
  }, [data]);

  const updateMutation = trpc.admin.settings.update.useMutation({
    onSuccess: () => {
      utils.admin.settings.get.invalidate();
      utils.site.settings.invalidate();
      toast.success("Website settings updated");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Website Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">จัดการข้อความหลักของเว็บไซต์และข้อมูลการติดต่อจากศูนย์กลาง</p>
        </div>

        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Public Website Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium mb-1 block">Site name</label><Input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} /></div>
                <div><label className="text-sm font-medium mb-1 block">Support email</label><Input value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} /></div>
              </div>
              <div><label className="text-sm font-medium mb-1 block">Site tagline</label><Input value={form.siteTagline} onChange={(e) => setForm({ ...form, siteTagline: e.target.value })} /></div>
              <div><label className="text-sm font-medium mb-1 block">Hero eyebrow</label><Input value={form.heroEyebrow} onChange={(e) => setForm({ ...form, heroEyebrow: e.target.value })} /></div>
              <div><label className="text-sm font-medium mb-1 block">Hero title</label><textarea value={form.heroTitle} onChange={(e) => setForm({ ...form, heroTitle: e.target.value })} className="w-full min-h-[96px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
              <div><label className="text-sm font-medium mb-1 block">Hero description</label><textarea value={form.heroDescription} onChange={(e) => setForm({ ...form, heroDescription: e.target.value })} className="w-full min-h-[120px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
              <div><label className="text-sm font-medium mb-1 block">Footer text</label><textarea value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} className="w-full min-h-[100px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
              <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending} className="gap-2">
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Settings
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
