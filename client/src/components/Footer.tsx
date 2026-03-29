import { trpc } from "@/lib/trpc";

export default function Footer() {
  const { data: settings } = trpc.site.settings.useQuery();
  const siteName = settings?.siteName || "AI Academy";
  const footerText = settings?.footerText || "Master AI with precision. Premium courses designed for the next generation of builders.";
  const supportEmail = settings?.supportEmail || "help@aicourse.academy";

  return (
    <footer className="relative z-10 border-t border-white/10 mt-24">
      <div className="container py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="font-bold text-lg">{siteName}</div>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs">{footerText}</p>
          </div>
          <div className="flex gap-12">
            <div>
              <h4 className="eyebrow mb-3">Platform</h4>
              <div className="flex flex-col gap-2">
                <a href="/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Courses</a>
                <a href="/my-courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">My Courses</a>
              </div>
            </div>
            <div>
              <h4 className="eyebrow mb-3">Support</h4>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">{supportEmail}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 text-sm text-muted-foreground">&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</div>
      </div>
    </footer>
  );
}
