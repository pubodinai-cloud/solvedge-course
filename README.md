# AI Course Platform

แพลตฟอร์มคอร์สออนไลน์ที่พร้อมต่อยอดเป็น production ด้วย:
- Vite + React + TypeScript
- Express + tRPC
- Drizzle ORM + MySQL
- Stripe Checkout
- Email/Password authentication

## พร้อมแล้วสำหรับ
- สมัครสมาชิก / ล็อกอินด้วยอีเมลและรหัสผ่าน
- จัดการคอร์ส / บทเรียน / สมาชิก
- ระบบซื้อคอร์สผ่าน Stripe
- Deploy บน Railway

## เริ่มต้นในเครื่อง
```bash
corepack enable
corepack prepare pnpm@10.4.1 --activate
pnpm install
cp .env.example .env
pnpm dev
```

## Environment Variables
ดูตัวอย่างที่ `.env.example`

### จำเป็น
- `JWT_SECRET`
- `OWNER_EMAIL`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### optional
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_URL`
- `VITE_FRONTEND_FORGE_API_KEY`

## Database
โปรเจคนี้ใช้ MySQL

ตัวอย่าง:
```env
DATABASE_URL=mysql://user:password@host:3306/ai_course_platform
```

## Railway Deploy
มีไฟล์ `railway.toml` ให้แล้ว

### ก่อน deploy ต้องตั้ง env ใน Railway
- `JWT_SECRET`
- `OWNER_EMAIL`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## คำสั่งสำคัญ
```bash
pnpm dev
pnpm check
pnpm build
pnpm start
pnpm db:push
node server/seed.mjs
```

## หมายเหตุ
- ระบบ auth ถูกเปลี่ยนจาก OAuth เป็น Email/Password ภายในระบบแล้ว
- ผู้ใช้ที่สมัครด้วยอีเมลตรงกับ `OWNER_EMAIL` จะได้สิทธิ์ admin
