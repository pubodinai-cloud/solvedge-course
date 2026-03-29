import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, BookOpen, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: settings } = trpc.site.settings.useQuery();
  const siteName = settings?.siteName || "AI Academy";

  const navLinks = [{ href: "/", label: "Home" }, { href: "/courses", label: "Courses" }];

  return <header className="sticky top-3 z-30 px-4">
    <nav className="glass-nav max-w-5xl mx-auto flex items-center justify-between gap-3 px-4 py-3 md:px-6">
      <Link href="/" className="font-bold text-lg tracking-tight text-foreground">{siteName}</Link>
      <div className="hidden md:flex items-center gap-6">
        {navLinks.map((link) => <Link key={link.href} href={link.href} className={`text-sm transition-colors ${location === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{link.label}</Link>)}
        {isAuthenticated && <Link href="/my-courses" className={`text-sm transition-colors ${location === "/my-courses" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>My Courses</Link>}
      </div>
      <div className="hidden md:flex items-center gap-3">
        {isAuthenticated ? <DropdownMenu><DropdownMenuTrigger asChild><button className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-white/5 transition-colors focus:outline-none"><Avatar className="h-8 w-8 border border-white/10"><AvatarFallback className="text-xs font-medium bg-primary/20 text-primary">{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback></Avatar><span className="text-sm font-medium">{user?.name || "User"}</span></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={() => window.location.href = "/my-courses"}><BookOpen className="mr-2 h-4 w-4" />My Courses</DropdownMenuItem>{user?.role === "admin" && <DropdownMenuItem onClick={() => window.location.href = "/admin"}><Shield className="mr-2 h-4 w-4" />Admin Panel</DropdownMenuItem>}<DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu> : <a href={getLoginUrl()} className="btn-neon px-5 py-2 text-sm inline-flex items-center">Sign In</a>}
      </div>
      <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
    </nav>
    {mobileOpen && <div className="md:hidden glass-nav max-w-5xl mx-auto mt-2 p-4 rounded-2xl flex flex-col gap-3">{navLinks.map((link) => <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="text-sm py-2 text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link>)}{isAuthenticated && <><Link href="/my-courses" onClick={() => setMobileOpen(false)} className="text-sm py-2 text-muted-foreground hover:text-foreground">My Courses</Link>{user?.role === "admin" && <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-sm py-2 text-muted-foreground hover:text-foreground">Admin Panel</Link>}<button onClick={logout} className="text-sm py-2 text-destructive text-left">Sign out</button></>}{!isAuthenticated && <a href={getLoginUrl()} className="btn-neon px-5 py-2 text-sm text-center">Sign In</a>}</div>}
  </header>;
}
