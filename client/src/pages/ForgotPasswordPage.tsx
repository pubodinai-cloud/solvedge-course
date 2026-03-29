import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useSearch } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const mutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      if (data.emailed) {
        setMessage("ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว กรุณาเช็กกล่องจดหมายของคุณ");
        return;
      }
      setMessage(data.resetUrl ? `ลิงก์รีเซ็ตสำรอง: ${data.resetUrl}` : "ถ้ามีอีเมลนี้อยู่ในระบบ จะมีลิงก์รีเซ็ตให้");
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>ขอลิงก์สำหรับตั้งรหัสผ่านใหม่</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate({ email }); }}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {message && <p className="text-sm text-emerald-400 break-all">{message}</p>}
            <Button type="submit" className="w-full">{mutation.isPending ? "Please wait..." : "Request reset link"}</Button>
          </form>
          <div className="mt-4 text-sm text-muted-foreground">
            <Link href={getLoginUrl()} className="text-primary">กลับไปหน้าเข้าสู่ระบบ</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ResetPasswordPage() {
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") || "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const mutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => setMessage("เปลี่ยนรหัสผ่านสำเร็จแล้ว กรุณาเข้าสู่ระบบใหม่"),
    onError: (err) => setMessage(err.message),
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate({ token, password }); }}>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            {message && <p className="text-sm text-emerald-400 break-all">{message}</p>}
            <Button type="submit" className="w-full">{mutation.isPending ? "Please wait..." : "Reset password"}</Button>
          </form>
          <div className="mt-4 text-sm text-muted-foreground">
            <Link href={getLoginUrl()} className="text-primary">กลับไปหน้าเข้าสู่ระบบ</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
