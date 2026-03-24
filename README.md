# SolvEdge Course Platform

## 🎯 Overview
ระบบขายคอร์ส AI ออนไลน์ - รองรับวิดีโอและ E-book

## 🚀 Features

### Frontend (หน้าบ้าน)
- ✅ หน้าแสดงคอร์สทั้งหมด
- ✅ หน้ารายละเอียดคอร์ส
- ✅ ระบบตะกร้าสินค้า
- ✅ หน้าชำระเงิน (Stripe)
- ✅ หน้าสมาชิก / โปรไฟล์
- ✅ Responsive Design

### Backend (หลังบ้าน)
- ✅ ระบบจัดการคอร์ส (CRUD)
- ✅ ระบบจัดการผู้ใช้
- ✅ ระบบออเดอร์
- ✅ ระบบสิทธิ์การเข้าถึงคอร์ส
- ✅ Dashboard สถิติ

### Payment
- ✅ Stripe Integration
- ✅ รองรับบัตรเครดิต/เดบิต

## 📦 Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env with your values
nano .env

# 4. Start the server
npm run dev
```

## 🔧 Configuration

### Stripe Setup
1. สร้างบัญชีที่ https://stripe.com
2. ไปที่ Dashboard > Developers > API Keys
3. คัดลอก Secret Key และ Publishable Key
4. ใส่ในไฟล์ `.env`

### Database
- ใช้ SQLite (ไม่ต้องติดตั้งเพิ่ม)
- ไฟล์จะอยู่ที่ `./database/solvedge.db`

## 📁 Project Structure

```
solvedge-course/
├── frontend/           # หน้าบ้าน (HTML/CSS/JS)
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── backend/            # หลังบ้าน (Node.js)
│   ├── server.js
│   ├── routes/
│   └── middleware/
├── database/           # ฐานข้อมูล (SQLite)
├── assets/             # ไฟล์สื่อ
│   ├── images/
│   ├── videos/
│   └── ebooks/
└── uploads/            # ไฟล์อัพโหลด
```

## 🌐 Deployment

### Option 1: VPS (Hostinger, DigitalOcean, etc.)
```bash
# 1. SSH to server
ssh user@your-server

# 2. Clone/Upload project
git clone <repo-url> || scp -r solvedge-course user@server:/var/www/

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install PM2
sudo npm install -g pm2

# 5. Start with PM2
cd /var/www/solvedge-course
npm install
pm2 start backend/server.js --name solvedge

# 6. Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/solvedge
```

### Option 2: Platform as a Service
- **Vercel**: Frontend + Serverless Functions
- **Railway**: Full Node.js app
- **Render**: Free tier available

## 📞 Support

- Email: support@solvedge.com
- Website: https://solvedge.com

---
Built with ❤️ by SolvEdge Team
