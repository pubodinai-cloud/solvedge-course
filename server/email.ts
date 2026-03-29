import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("RESEND_FROM_EMAIL is not set");

  const resend = getResendClient();
  return resend.emails.send({
    from,
    to: params.to,
    subject: "Reset your password - SolvEdge",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Reset your password</h2>
        <p>เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ</p>
        <p>
          <a href="${params.resetUrl}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">
            Reset Password
          </a>
        </p>
        <p>หรือนำลิงก์นี้ไปเปิด:</p>
        <p>${params.resetUrl}</p>
        <p>ลิงก์นี้จะหมดอายุใน 30 นาที</p>
      </div>
    `,
  });
}
