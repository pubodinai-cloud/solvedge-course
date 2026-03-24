module.exports = (db) => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Courses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      sale_price REAL,
      thumbnail TEXT,
      video_url TEXT,
      ebook_url TEXT,
      duration TEXT,
      level TEXT DEFAULT 'beginner',
      category TEXT,
      featured INTEGER DEFAULT 0,
      published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'THB',
      status TEXT DEFAULT 'pending',
      stripe_payment_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )
  `);

  // User courses (enrollments)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      progress INTEGER DEFAULT 0,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      UNIQUE(user_id, course_id)
    )
  `);

  // Create default admin if not exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@solvedge.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync(adminPassword, 10);

  try {
    db.prepare(`
      INSERT OR IGNORE INTO users (email, password, name, role)
      VALUES (?, ?, ?, 'admin')
    `).run(adminEmail, hashedPassword, 'Admin');
  } catch (err) {
    console.log('Admin already exists');
  }

  // Insert sample courses if empty
  const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get();
  if (courseCount.count === 0) {
    const sampleCourses = [
      {
        title: 'AI Fundamentals สำหรับผู้เริ่มต้น',
        description: 'เรียนรู้พื้นฐาน AI และ Machine Learning ตั้งแต่ศูนย์จนเป็นผู้เชี่ยวชาญ',
        price: 2990,
        sale_price: 1990,
        thumbnail: '/assets/images/courses/ai-fundamentals.jpg',
        video_url: '/assets/videos/ai-fundamentals/',
        ebook_url: '/assets/ebooks/ai-fundamentals.pdf',
        duration: '20 ชั่วโมง',
        level: 'beginner',
        category: 'AI Basics',
        featured: 1
      },
      {
        title: 'ChatGPT & Prompt Engineering Mastery',
        description: 'เทคนิคการใช้ ChatGPT และการเขียน Prompt ให้ได้ผลลัพธ์ที่ต้องการ',
        price: 1990,
        sale_price: 1490,
        thumbnail: '/assets/images/courses/chatgpt-mastery.jpg',
        video_url: '/assets/videos/chatgpt-mastery/',
        ebook_url: '/assets/ebooks/chatgpt-mastery.pdf',
        duration: '15 ชั่วโมง',
        level: 'intermediate',
        category: 'Generative AI',
        featured: 1
      },
      {
        title: 'AI for Business: เพิ่ม Productivity ด้วย AI',
        description: 'นำ AI มาใช้ในธุรกิจเพื่อเพิ่มประสิทธิภาพการทำงาน',
        price: 4990,
        sale_price: 3490,
        thumbnail: '/assets/images/courses/ai-business.jpg',
        video_url: '/assets/videos/ai-business/',
        ebook_url: '/assets/ebooks/ai-business.pdf',
        duration: '25 ชั่วโมง',
        level: 'advanced',
        category: 'Business AI',
        featured: 1
      }
    ];

    const insertCourse = db.prepare(`
      INSERT INTO courses (title, description, price, sale_price, thumbnail, video_url, ebook_url, duration, level, category, featured)
      VALUES (@title, @description, @price, @sale_price, @thumbnail, @video_url, @ebook_url, @duration, @level, @category, @featured)
    `);

    sampleCourses.forEach(course => insertCourse.run(course));
    console.log('✅ Sample courses inserted');
  }

  console.log('✅ Database initialized');
};
