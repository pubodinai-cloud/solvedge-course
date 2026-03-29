import { trpc } from "@/lib/trpc";
import { getForgotPasswordUrl, getLoginUrl, getRegisterUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function AuthPage({ mode = "login" }: { mode?: "login" | "register" }) {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/");
    },
    onError: (err) => setError(err.message),
  });

  const register = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/");
    },
    onError: (err) => setError(err.message),
  });

  const isRegister = mode === "register";
  const loading = login.isPending || register.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isRegister) {
      await register.mutateAsync({ name, email, password });
      return;
    }
    await login.mutateAsync({ email, password });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>{isRegister ? "Create account" : "Sign in"}</CardTitle>
          <CardDescription>
            {isRegister ? "สมัครสมาชิกเพื่อเริ่มเรียนคอร์ส" : "เข้าสู่ระบบเพื่อเข้าถึงคอร์สของคุณ"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full">
              {loading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-muted-foreground">
            {isRegister ? (
              <>
                มีบัญชีอยู่แล้ว? <Link href={getLoginUrl()} className="text-primary">เข้าสู่ระบบ</Link>
              </>
            ) : (
              <>
                ยังไม่มีบัญชี? <Link href={getRegisterUrl()} className="text-primary">สมัครสมาชิก</Link>
                <span className="mx-2">·</span>
                <Link href={getForgotPasswordUrl()} className="text-primary">ลืมรหัสผ่าน</Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
