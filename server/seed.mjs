import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const db = drizzle(DATABASE_URL);

const coursesData = [
  {
    title: "AI Fundamentals: From Zero to Hero",
    slug: "ai-fundamentals",
    description: "เรียนรู้พื้นฐาน AI ตั้งแต่เริ่มต้น ครอบคลุม Machine Learning, Neural Networks, และ Deep Learning พร้อมตัวอย่างจริงและแบบฝึกหัด",
    shortDescription: "เข้าใจพื้นฐาน AI, ML และ Deep Learning ตั้งแต่เริ่มต้น",
    price: "3900.00",
    difficulty: "beginner",
    category: "Machine Learning",
    published: true,
    totalLessons: 5,
    totalDurationMinutes: 180,
    lessons: [
      { title: "Introduction to AI & Machine Learning", description: "ทำความรู้จักกับ AI และ Machine Learning", durationMinutes: 30, sortOrder: 1, isFreePreview: true, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "Supervised Learning Explained", description: "เรียนรู้ Supervised Learning แบบเข้าใจง่าย", durationMinutes: 40, sortOrder: 2, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "Neural Networks Basics", description: "พื้นฐาน Neural Networks และการทำงาน", durationMinutes: 35, sortOrder: 3, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "Deep Learning Introduction", description: "เริ่มต้นกับ Deep Learning", durationMinutes: 45, sortOrder: 4, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "Hands-on Project: Image Classifier", description: "สร้าง Image Classifier ด้วย Python", durationMinutes: 30, sortOrder: 5, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
    ],
  },
  {
    title: "Prompt Engineering Masterclass",
    slug: "prompt-engineering",
    description: "เรียนรู้ศิลปะการเขียน Prompt สำหรับ ChatGPT, Claude และ AI อื่นๆ เพื่อผลลัพธ์ที่ดีที่สุด ครอบคลุมเทคนิค Chain-of-Thought, Few-shot Learning และอื่นๆ",
    shortDescription: "เทคนิคเขียน Prompt ให้ AI ทำงานตามต้องการอย่างแม่นยำ",
    price: "2900.00",
    difficulty: "beginner",
    category: "Prompt Engineering",
    published: true,
    totalLessons: 4,
    totalDurationMinutes: 120,
    lessons: [
      { title: "Prompt Engineering Fundamentals", description: "พื้นฐานการเขียน Prompt", durationMinutes: 25, sortOrder: 1, isFreePreview: true, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "Advanced Prompting Techniques", description: "เทคนิคขั้นสูง Chain-of-Thought, Few-shot", durationMinutes: 35, sortOrder: 2, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "Prompt for Code Generation", description: "เขียน Prompt สำหรับสร้างโค้ด", durationMinutes: 30, sortOrder: 3, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "Building AI Workflows", description: "สร้าง Workflow อัตโนมัติด้วย AI", durationMinutes: 30, sortOrder: 4, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
    ],
  },
  {
    title: "Python for AI & Data Science",
    slug: "python-ai-data-science",
    description: "คอร์ส Python เน้นการใช้งานด้าน AI และ Data Science ครอบคลุม NumPy, Pandas, Scikit-learn, TensorFlow และ PyTorch",
    shortDescription: "Python สำหรับ AI พร้อม NumPy, Pandas, TensorFlow",
    price: "4900.00",
    difficulty: "intermediate",
    category: "Programming",
    published: true,
    totalLessons: 6,
    totalDurationMinutes: 240,
    lessons: [
      { title: "Python Essentials for AI", description: "ทบทวน Python สำหรับงาน AI", durationMinutes: 35, sortOrder: 1, isFreePreview: true, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "NumPy & Pandas Deep Dive", description: "ใช้งาน NumPy และ Pandas อย่างมืออาชีพ", durationMinutes: 45, sortOrder: 2, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "Data Visualization with Matplotlib", description: "สร้าง Visualization สวยๆ", durationMinutes: 35, sortOrder: 3, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "Scikit-learn for ML", description: "สร้าง ML Model ด้วย Scikit-learn", durationMinutes: 40, sortOrder: 4, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "TensorFlow Basics", description: "เริ่มต้น TensorFlow", durationMinutes: 45, sortOrder: 5, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "PyTorch Fundamentals", description: "เริ่มต้น PyTorch", durationMinutes: 40, sortOrder: 6, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
    ],
  },
  {
    title: "Generative AI & LLM Applications",
    slug: "generative-ai-llm",
    description: "เจาะลึก Generative AI และ Large Language Models สร้างแอปพลิเคชันด้วย OpenAI API, LangChain และ RAG",
    shortDescription: "สร้างแอป AI ด้วย LLM, LangChain และ RAG",
    price: "5900.00",
    difficulty: "advanced",
    category: "Generative AI",
    published: true,
    totalLessons: 5,
    totalDurationMinutes: 200,
    lessons: [
      { title: "Understanding LLMs", description: "เข้าใจ Large Language Models", durationMinutes: 35, sortOrder: 1, isFreePreview: true, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "OpenAI API Deep Dive", description: "ใช้งาน OpenAI API อย่างมืออาชีพ", durationMinutes: 40, sortOrder: 2, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "LangChain Framework", description: "สร้าง AI Chain ด้วย LangChain", durationMinutes: 45, sortOrder: 3, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "RAG: Retrieval Augmented Generation", description: "สร้างระบบ RAG", durationMinutes: 40, sortOrder: 4, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "Building a Full AI Application", description: "สร้างแอป AI เต็มรูปแบบ", durationMinutes: 40, sortOrder: 5, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
    ],
  },
  {
    title: "Computer Vision with Deep Learning",
    slug: "computer-vision-deep-learning",
    description: "เรียนรู้ Computer Vision ด้วย Deep Learning ครอบคลุม CNN, Object Detection, Image Segmentation และ GANs",
    shortDescription: "Computer Vision ด้วย CNN, YOLO และ GANs",
    price: "4900.00",
    difficulty: "advanced",
    category: "Computer Vision",
    published: true,
    totalLessons: 5,
    totalDurationMinutes: 210,
    lessons: [
      { title: "Introduction to Computer Vision", description: "พื้นฐาน Computer Vision", durationMinutes: 35, sortOrder: 1, isFreePreview: true, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "CNN Architecture Deep Dive", description: "เจาะลึก CNN", durationMinutes: 45, sortOrder: 2, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "Object Detection with YOLO", description: "Object Detection ด้วย YOLO", durationMinutes: 45, sortOrder: 3, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "Image Segmentation", description: "Image Segmentation เทคนิคต่างๆ", durationMinutes: 40, sortOrder: 4, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { title: "GANs: Generative Adversarial Networks", description: "สร้างภาพด้วย GANs", durationMinutes: 45, sortOrder: 5, isFreePreview: false, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
    ],
  },
];

async function seed() {
  console.log("Seeding courses...");
  for (const courseData of coursesData) {
    const { lessons: lessonsData, ...course } = courseData;
    // Check if course already exists
    const existing = await db.execute(sql`SELECT id FROM courses WHERE slug = ${course.slug} LIMIT 1`);
    if (existing[0] && existing[0].length > 0) {
      console.log(`  Skipping "${course.title}" (already exists)`);
      continue;
    }
    const result = await db.execute(sql`
      INSERT INTO courses (title, slug, description, shortDescription, price, difficulty, category, published, totalLessons, totalDurationMinutes)
      VALUES (${course.title}, ${course.slug}, ${course.description}, ${course.shortDescription}, ${course.price}, ${course.difficulty}, ${course.category}, ${course.published ? 1 : 0}, ${course.totalLessons}, ${course.totalDurationMinutes})
    `);
    const courseId = result[0].insertId;
    console.log(`  Created course: ${course.title} (id: ${courseId})`);
    for (const lesson of lessonsData) {
      await db.execute(sql`
        INSERT INTO lessons (courseId, title, description, videoUrl, durationMinutes, sortOrder, isFreePreview)
        VALUES (${courseId}, ${lesson.title}, ${lesson.description}, ${lesson.videoUrl}, ${lesson.durationMinutes}, ${lesson.sortOrder}, ${lesson.isFreePreview ? 1 : 0})
      `);
    }
    console.log(`    Added ${lessonsData.length} lessons`);
  }
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
