export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 mt-24">
      <div className="container py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="font-bold text-lg">AI Academy</div>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs">
              Master AI with precision. Premium courses designed for the next generation of builders.
            </p>
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
                <span className="text-sm text-muted-foreground">help@aicourse.academy</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AI Academy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
