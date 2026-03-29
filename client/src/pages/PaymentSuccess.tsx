import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { CheckCircle2, Loader2, XCircle, ArrowRight } from "lucide-react";
import { useMemo } from "react";

export default function PaymentSuccess() {
  const { isAuthenticated } = useAuth();
  const sessionId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("session_id") || "";
  }, []);

  const { data, isLoading, error } = trpc.enrollment.verifyPayment.useQuery(
    { sessionId },
    { enabled: !!sessionId && isAuthenticated, retry: 3, retryDelay: 2000 }
  );

  return (
    <div className="min-h-screen relative">
      <div className="grid-bg" /><div className="glow-orb-1" />
      <Navbar />
      <main className="relative z-10">
        <div className="container pt-24 pb-16 flex justify-center">
          <div className="glass-panel p-8 md:p-12 max-w-md w-full text-center">
            {isLoading ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Verifying Payment...</h1>
                <p className="text-muted-foreground">กำลังตรวจสอบการชำระเงิน กรุณารอสักครู่</p>
              </>
            ) : data?.success ? (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
                <p className="text-muted-foreground mb-6">ชำระเงินสำเร็จ! คุณสามารถเริ่มเรียนได้ทันที</p>
                <Link href="/my-courses">
                  <span className="btn-neon px-6 py-3 inline-flex items-center gap-2">
                    Go to My Courses <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Payment Issue</h1>
                <p className="text-muted-foreground mb-6">
                  ไม่สามารถยืนยันการชำระเงินได้ กรุณาลองใหม่อีกครั้งหรือติดต่อฝ่ายสนับสนุน
                </p>
                <Link href="/courses">
                  <span className="btn-neon px-6 py-3 inline-flex items-center gap-2">
                    Back to Courses <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
