const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'ankit kumar';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || '';
const ADMIN_SESSION_COOKIE = 'portfolio_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const CORS_ALLOWED_ORIGINS = new Set(
  (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
);
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Portfolio Contact Form';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const frontendPath = path.join(__dirname, '..', 'frontend');
const databaseDir = path.join(__dirname, '..', 'database');
const rootDbPath = path.join(__dirname, '..', 'messages.db');
const dbPath = path.join(databaseDir, 'messages.db');

// Submission tracking for rate limiting
const submissionTracker = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_SUBMISSIONS_PER_WINDOW = 5;
const chatbotSubmissionTracker = new Map();
const CHATBOT_RATE_LIMIT_WINDOW = 60000;
const MAX_CHATBOT_SUBMISSIONS_PER_WINDOW = 20;

// Input validation constants
const FIELD_LIMITS = {
  name: 100,
  email: 255,
  subject: 200,
  message: 5000
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

fs.mkdirSync(databaseDir, { recursive: true });

if (!fs.existsSync(dbPath) && fs.existsSync(rootDbPath)) {
  fs.copyFileSync(rootDbPath, dbPath);
}

app.use(cors({
  origin: (origin, callback) => callback(null, Boolean(origin && CORS_ALLOWED_ORIGINS.has(origin))),
  credentials: true
}));
app.use(express.json());

function isAdminConfigured() {
  return Boolean(ADMIN_USERNAME && ADMIN_PASSWORD && ADMIN_SESSION_SECRET);
}

function safeEqual(a, b) {
  const aBuffer = Buffer.from(String(a));
  const bBuffer = Buffer.from(String(b));

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function parseCookieHeader(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, rawPair) => {
    const pair = rawPair.trim();
    if (!pair) return cookies;
    const [name, ...rest] = pair.split('=');
    cookies[name] = decodeURIComponent(rest.join('='));
    return cookies;
  }, {});
}

function signSessionPayload(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expectedSignature = crypto.createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(payloadPart)
    .digest('base64url');

  if (!safeEqual(signaturePart, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    if (!payload.username || !payload.expiresAt || payload.expiresAt < Date.now()) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

function getAdminSessionFromRequest(req) {
  const cookies = parseCookieHeader(req.headers.cookie || '');
  const token = cookies[ADMIN_SESSION_COOKIE];
  return verifySessionToken(token);
}

function setAdminSessionCookie(res, username) {
  const payload = {
    username,
    expiresAt: Date.now() + SESSION_TTL_MS
  };

  const token = signSessionPayload(payload);
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: SESSION_TTL_MS,
    path: '/'
  });
}

function clearAdminSessionCookie(res) {
  res.clearCookie(ADMIN_SESSION_COOKIE, { path: '/' });
}

function isValidAdminRequest(req) {
  if (!isAdminConfigured()) {
    return false;
  }

  const session = getAdminSessionFromRequest(req);
  if (session && session.username === ADMIN_USERNAME) {
    req.adminUser = session.username;
    return true;
  }

  const authHeader = req.headers.authorization;
  if (authHeader) {
    const expectedHeader = `Basic ${Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString('base64')}`;
    if (safeEqual(authHeader, expectedHeader)) {
      req.adminUser = ADMIN_USERNAME;
      return true;
    }
  }

  return false;
}

function requireAdmin(req, res, next) {
  if (!isAdminConfigured()) {
    res.status(503).json({ error: 'Admin authentication is not configured.' });
    return;
  }

  if (isValidAdminRequest(req)) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
  res.status(401).json({ error: 'Unauthorized' });
}

// Security: Sanitize input
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

// Validate email format
function isValidEmail(email) {
  return EMAIL_REGEX.test(email) && email.length <= FIELD_LIMITS.email;
}

// Check rate limit
function checkRateLimit(ip) {
  const now = Date.now();
  if (!submissionTracker.has(ip)) {
    submissionTracker.set(ip, []);
  }
  
  const submissions = submissionTracker.get(ip);
  const recentSubmissions = submissions.filter(time => now - time < RATE_LIMIT_WINDOW);
  submissionTracker.set(ip, recentSubmissions);

  return recentSubmissions.length < MAX_SUBMISSIONS_PER_WINDOW;
}

function checkChatbotRateLimit(ip) {
  const now = Date.now();
  const recentSubmissions = (chatbotSubmissionTracker.get(ip) || [])
    .filter(time => now - time < CHATBOT_RATE_LIMIT_WINDOW);

  if (recentSubmissions.length >= MAX_CHATBOT_SUBMISSIONS_PER_WINDOW) {
    chatbotSubmissionTracker.set(ip, recentSubmissions);
    return false;
  }

  recentSubmissions.push(now);
  chatbotSubmissionTracker.set(ip, recentSubmissions);
  return true;
}

// Record submission
function recordSubmission(ip) {
  if (!submissionTracker.has(ip)) {
    submissionTracker.set(ip, []);
  }
  submissionTracker.get(ip).push(Date.now());
}

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin.html'));
});

app.use(express.static(frontendPath));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    return;
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      reply TEXT,
      replied_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (createErr) => {
    if (createErr) {
      console.error('Table setup failed:', createErr.message);
      return;
    }

    // Add subject column if it doesn't exist
    db.run('ALTER TABLE messages ADD COLUMN subject TEXT', (subjectErr) => {
      if (subjectErr && !/duplicate column name/i.test(subjectErr.message)) {
        console.error('Subject column setup failed:', subjectErr.message);
      }
    });

    // Add status column if it doesn't exist
    db.run("ALTER TABLE messages ADD COLUMN status TEXT DEFAULT 'new'", (statusErr) => {
      if (statusErr && !/duplicate column name/i.test(statusErr.message)) {
        console.error('Status column setup failed:', statusErr.message);
      }
    });

    // Add updated_at column if it doesn't exist (without default)
    db.run('ALTER TABLE messages ADD COLUMN updated_at DATETIME', (updatedErr) => {
      if (updatedErr && !/duplicate column name/i.test(updatedErr.message)) {
        console.error('Updated_at column setup failed:', updatedErr.message);
      }
    });

    db.run('ALTER TABLE messages ADD COLUMN reply TEXT', (replyErr) => {
      if (replyErr && !/duplicate column name/i.test(replyErr.message)) {
        console.error('Reply column setup failed:', replyErr.message);
      }
    });

    db.run('ALTER TABLE messages ADD COLUMN replied_at DATETIME', (repliedAtErr) => {
      if (repliedAtErr && !/duplicate column name/i.test(repliedAtErr.message)) {
        console.error('Replied at column setup failed:', repliedAtErr.message);
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS location (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        lat REAL,
        lng REAL,
        accuracy REAL,
        heading REAL,
        speed REAL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (locErr) => {
      if (locErr) {
        console.error('Location table setup failed:', locErr.message);
      } else {
        db.run('INSERT OR IGNORE INTO location (id, lat, lng, accuracy, updated_at) VALUES (1, NULL, NULL, NULL, CURRENT_TIMESTAMP)', (seedErr) => {
          if (seedErr) {
            console.error('Location seed row failed:', seedErr.message);
          }
        });
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS education (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        degree TEXT NOT NULL,
        institution TEXT NOT NULL,
        college TEXT,
        field_of_study TEXT,
        start_year INTEGER,
        end_year INTEGER,
        status TEXT DEFAULT 'Completed',
        grade TEXT,
        location TEXT,
        coursework TEXT,
        achievements TEXT,
        description TEXT,
        logo_url TEXT,
        document_url TEXT,
        published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (educationErr) => {
      if (educationErr) {
        console.error('Education table setup failed:', educationErr.message);
      } else {
        db.run(`
          INSERT OR IGNORE INTO education (
            id, degree, institution, college, field_of_study, start_year, end_year, status, grade, location, coursework, achievements, description, logo_url, document_url, published, created_at, updated_at
          ) VALUES
            (1, 'B.Tech in Artificial Intelligence & Data Science', 'Sengunthar Engineering College', '', 'Artificial Intelligence & Data Science', 2023, 2027, 'Pursuing', 'CGPA: 7.77 / 10', 'Tamil Nadu, India', 'AI fundamentals, data structures, software engineering, analytics foundations', 'Academic focus on AI, analytics, and technical problem-solving', 'Building a foundation in artificial intelligence, data science, and applied software development.', '', '', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (2, 'Higher Secondary Education (Class XII)', 'Vaishali Higher Secondary School', '', 'Science / Mathematics', 2021, 2023, 'Completed', '', '', 'School education', '', 'Completed secondary education with a focus on mathematics, science, and analytical thinking.', '', '', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (3, 'Secondary Education (Class X)', 'Vaishali Vidyalaya', '', 'General Education', 2019, 2021, 'Completed', '', '', 'School education', '', 'Completed foundational schooling with a strong interest in technology and continuous learning.', '', '', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, (seedErr) => {
          if (seedErr) {
            console.error('Education seed data failed:', seedErr.message);
          }
        });
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS portfolio_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (configErr) => {
      if (configErr) {
        console.error('Portfolio config table setup failed:', configErr.message);
      } else {
        const defaults = [
          ['professional_introduction', 'I am an aspiring Full Stack Web Developer and Generative AI Developer focused on building clean interfaces, reliable APIs, and AI-powered product experiences.'],
          ['career_availability', 'Open to internships and junior opportunities.'],
          ['chatbot_enabled', 'true'],
          ['chatbot_intro', 'Hi! 👋 I\'m your AI Portfolio Assistant. I can help you explore my published projects, education, skills, development interests, and professional background. What would you like to know?']
        ];

        defaults.forEach(([key, value]) => {
          db.run('INSERT OR IGNORE INTO portfolio_config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [key, value]);
        });
      }
    });

    console.log('Local database ready with enhanced schema');
  });
});

async function supabaseRequest(endpoint, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Supabase request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function getMessagesFromLocalDb() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM messages ORDER BY created_at DESC', [], (err, rows) => {
      if (err) {
        reject(new Error('Failed to fetch messages'));
        return;
      }
      resolve(rows);
    });
  });
}

function saveMessageToLocalDb(name, email, subject, message) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO messages (name, email, subject, message, status, reply, replied_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
    stmt.run(name, email, subject, message, 'new', function (err) {
      stmt.finalize();
      if (err) {
        reject(new Error('Failed to save message'));
        return;
      }
      resolve({ success: true, id: this.lastID });
    });
  });
}

function updateMessageStatusInLocalDb(id, status) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE messages SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id], function (err) {
      if (err) {
        reject(new Error('Failed to update message status'));
        return;
      }

      if (this.changes === 0) {
        resolve({ success: false, notFound: true });
        return;
      }

      resolve({ success: true });
    });
  });
}

function saveReplyToLocalDb(id, reply) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE messages SET reply = ?, replied_at = CURRENT_TIMESTAMP, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [reply, 'replied', id], function (err) {
      if (err) {
        reject(new Error('Failed to save reply'));
        return;
      }

      if (this.changes === 0) {
        resolve({ success: false, notFound: true });
        return;
      }

      resolve({ success: true });
    });
  });
}

function deleteMessageFromLocalDb(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM messages WHERE id = ?', [id], function (err) {
      if (err) {
        reject(new Error('Failed to delete message'));
        return;
      }

      if (this.changes === 0) {
        resolve({ success: false, notFound: true });
        return;
      }

      resolve({ success: true });
    });
  });
}

function getLatestLocationFromLocalDb() {
  return new Promise((resolve, reject) => {
    db.get('SELECT lat, lng, accuracy, heading, speed, updated_at FROM location WHERE id = 1', [], (err, row) => {
      if (err) {
        reject(new Error('Failed to fetch location'));
        return;
      }
      resolve(row || null);
    });
  });
}

function saveLocationToLocalDb(lat, lng, accuracy, heading, speed) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE location SET lat = ?, lng = ?, accuracy = ?, heading = ?, speed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
      [lat, lng, accuracy, heading, speed],
      (err) => {
        if (err) {
          reject(new Error('Failed to save location'));
          return;
        }
        resolve({ success: true });
      }
    );
  });
}

async function sendContactNotification({ name, email, subject, message, createdAt }) {
  const hasSmtpConfig = SMTP_HOST && SMTP_USER && SMTP_PASSWORD && ADMIN_EMAIL;
  if (!hasSmtpConfig) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    }
  });

  await transporter.sendMail({
    from: `${EMAIL_FROM_NAME} <${SMTP_USER}>`,
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: `New contact message: ${subject}`,
    text: [
      `Visitor Name: ${name}`,
      `Visitor Email: ${email}`,
      `Subject: ${subject}`,
      `Submitted At: ${new Date(createdAt).toLocaleString()}`,
      '',
      'Message:',
      message
    ].join('\n'),
    html: `
      <h3>New Contact Message</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Submitted:</strong> ${new Date(createdAt).toLocaleString()}</p>
      <p><strong>Message:</strong></p>
      <div>${message.replace(/\n/g, '<br>')}</div>
    `
  });
}

const PORTFOLIO_PROFILE = {
  name: 'Ankit Kumar',
  title: 'Full Stack Web Developer and Generative AI Developer',
  intro: 'I am an aspiring Full Stack Web Developer and Generative AI Developer focused on building responsive web experiences, reliable APIs, and AI-powered workflows.',
  skills: {
    frontend: ['HTML5', 'CSS3', 'JavaScript'],
    backend: ['Node.js', 'Express.js', 'REST APIs', 'Auth concepts'],
    database: ['PostgreSQL', 'MySQL', 'MongoDB'],
    ai: ['LLM APIs', 'Prompt design', 'RAG concepts', 'AI apps'],
    tools: ['Git', 'GitHub', 'VS Code', 'Deployment']
  },
  contact: {
    email: 'ANKITKUMAR.DATA39@GMAIL.COM',
    github: 'https://github.com/ankitbuilds-SEC',
    linkedin: 'https://www.linkedin.com/in/ankit-kumar-b66067406',
    instagram: 'https://www.instagram.com/ankit_kumarofficial08?igsh=OHFqbnN6d2dwY3Bw',
    whatsapp: 'https://wa.me/919229047285?text=Hello%20Ankit%2C%20I%20would%20like%20to%20connect%20with%20you%20regarding%20opportunities.'
  },
  focus: 'Full Stack + AI',
  location: 'India'
};

function getConfigValue(key, fallback = '') {
  return new Promise((resolve) => {
    db.get('SELECT value FROM portfolio_config WHERE key = ?', [key], (err, row) => {
      if (err || !row) {
        resolve(fallback);
        return;
      }
      resolve(row.value || fallback);
    });
  });
}

function setConfigValue(key, value) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO portfolio_config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
      [key, String(value || '')],
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      }
    );
  });
}

function getEducationRecordsFromDb(includePrivate = false) {
  return new Promise((resolve, reject) => {
    const query = includePrivate
      ? 'SELECT * FROM education ORDER BY start_year DESC, end_year DESC, id DESC'
      : 'SELECT * FROM education WHERE published = 1 ORDER BY start_year DESC, end_year DESC, id DESC';

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(new Error('Failed to load education data'));
        return;
      }
      resolve(rows || []);
    });
  });
}

function sanitizeEducationPayload(payload = {}) {
  const degree = String(payload.degree || '').trim();
  const institution = String(payload.institution || '').trim();
  const startYear = payload.start_year !== undefined && payload.start_year !== null && payload.start_year !== '' ? Number(payload.start_year) : null;
  const endYear = payload.end_year !== undefined && payload.end_year !== null && payload.end_year !== '' ? Number(payload.end_year) : null;
  const status = ['Completed', 'Pursuing', 'Discontinued'].includes(payload.status) ? payload.status : 'Completed';

  if (!degree || !institution) {
    throw new Error('Degree and institution are required fields.');
  }

  if (startYear !== null && Number.isNaN(startYear)) {
    throw new Error('Start year must be a valid number.');
  }

  if (endYear !== null && Number.isNaN(endYear)) {
    throw new Error('Graduation year must be a valid number.');
  }

  if (startYear !== null && endYear !== null && endYear < startYear) {
    throw new Error('End year cannot be earlier than the start year.');
  }

  return {
    degree,
    institution,
    college: String(payload.college || '').trim(),
    field_of_study: String(payload.field_of_study || '').trim(),
    start_year: startYear,
    end_year: endYear,
    status,
    grade: String(payload.grade || '').trim(),
    location: String(payload.location || '').trim(),
    coursework: String(payload.coursework || '').trim(),
    achievements: String(payload.achievements || '').trim(),
    description: String(payload.description || '').trim(),
    logo_url: String(payload.logo_url || '').trim(),
    document_url: String(payload.document_url || '').trim(),
    published: payload.published === false ? 0 : 1
  };
}

async function buildPortfolioKnowledgeBase() {
  const [education, professionalIntroduction, careerAvailability] = await Promise.all([
    getEducationRecordsFromDb(false),
    getConfigValue('professional_introduction', PORTFOLIO_PROFILE.intro),
    getConfigValue('career_availability', '')
  ]);

  return {
    profile: {
      ...PORTFOLIO_PROFILE,
      intro: professionalIntroduction
    },
    education,
    projects: [],
    careerAvailability
  };
}

function buildFallbackAssistantResponse(message, knowledge) {
  const text = String(message || '').toLowerCase();
  const profile = knowledge.profile;

  if (/\bnot (?:mentioned|provided|listed|available)\b|\bunknown\b|\bunpublished\b/.test(text)) {
    return 'That information is not mentioned in the published portfolio content, so I cannot verify it.';
  }

  if (text.includes('project')) {
    if (!knowledge.projects.length) {
      return 'No projects have been published on this portfolio yet. New Full Stack Development and Generative AI projects are in progress.';
    }
    return `The published projects are: ${knowledge.projects.map(project => project.title).join(', ')}.`;
  }

  if (text.includes('education') || text.includes('school') || text.includes('college') || text.includes('degree') || text.includes('academic')) {
    if (!knowledge.education.length) {
      return 'Education details have not been published on this portfolio, so I cannot confirm the owner’s academic background.';
    }

    const records = knowledge.education.map(record => {
      const period = [record.start_year, record.end_year].filter(Boolean).join('–');
      const details = [record.degree, record.institution, record.field_of_study, period, record.status]
        .filter(Boolean)
        .join(' — ');
      return details;
    });
    return `The published education records are: ${records.join('; ')}.`;
  }

  if (text.includes('skill') || text.includes('technology') || text.includes('frontend') || text.includes('backend') || text.includes('stack')) {
    const skills = Object.entries(profile.skills)
      .map(([area, entries]) => `${area}: ${entries.join(', ')}`)
      .join('; ');
    return `The skills listed on this portfolio are ${skills}.`;
  }

  if (text.includes('ai') || text.includes('generative ai') || text.includes('llm') || text.includes('prompt')) {
    return `The Generative AI skills listed on this portfolio are ${profile.skills.ai.join(', ')}.`;
  }

  if (text.includes('contact') || text.includes('reach') || text.includes('email') || text.includes('linkedin') || text.includes('github')) {
    return `You can contact the owner using the published email ${profile.contact.email}, LinkedIn ${profile.contact.linkedin}, GitHub ${profile.contact.github}, or the contact form on this portfolio.`;
  }

  if (text.includes('open') || text.includes('opportunity') || text.includes('job') || text.includes('intern')) {
    return knowledge.careerAvailability
      ? `The published availability statement is: ${knowledge.careerAvailability}`
      : 'Availability information has not been published on this portfolio.';
  }

  if (text.includes('owner') || text.includes('about') || text.includes('who') || text.includes('name') || text.includes('portfolio')) {
    return `The portfolio belongs to ${profile.name}. The published profile describes the owner as a ${profile.title} and says: ${profile.intro}`;
  }

  return 'That information is not mentioned in the published portfolio content, so I cannot verify it.';
}

async function generateAssistantReply(message) {
  const knowledge = await buildPortfolioKnowledgeBase();

  if (!OPENAI_API_KEY) {
    return {
      answer: buildFallbackAssistantResponse(message, knowledge),
      provider: 'offline',
      fallbackUsed: true,
      status: 'AI service temporarily unavailable; using portfolio knowledge fallback.'
    };
  }

  try {
    const systemPrompt = [
      'You are Portfolio AI Assistant for Ankit Kumar.',
      'Use only the information in the following published portfolio data. Treat it as the complete source of truth.',
      'Never invent degrees, colleges, grades, projects, certifications, companies, or employment history.',
      'If asked for information missing from this data, clearly say it is not mentioned and do not guess.',
      'If the projects list is empty, say that no projects have been published yet.',
      'Keep answers concise, professional, relevant, and friendly.',
      `Published data: ${JSON.stringify(knowledge)}`
    ].join('\n');

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_output_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const answer = typeof payload.output_text === 'string'
      ? payload.output_text.trim()
      : (payload.output || [])
        .flatMap(item => Array.isArray(item.content) ? item.content : [])
        .filter(item => item.type === 'output_text' || typeof item.text === 'string')
        .map(item => item.text)
        .join('')
        .trim();
    if (!answer) {
      throw new Error('OpenAI returned no text response');
    }
    return {
      answer,
      provider: 'openai',
      fallbackUsed: false,
      status: 'Connected to OpenAI API.'
    };
  } catch (error) {
    console.error('OpenAI request failed:', error.message);
    return {
      answer: buildFallbackAssistantResponse(message, knowledge) + ' The AI service is temporarily unavailable, so I am using the published portfolio information available on this site.',
      provider: 'offline',
      fallbackUsed: true,
      status: 'AI service temporarily unavailable; using published portfolio information.'
    };
  }
}

app.get('/api/admin/session', (req, res) => {
  if (!isAdminConfigured()) {
    res.status(503).json({ error: 'Admin authentication is not configured.' });
    return;
  }

  const session = getAdminSessionFromRequest(req);
  if (session && session.username === ADMIN_USERNAME) {
    res.json({ authenticated: true, username: ADMIN_USERNAME });
    return;
  }

  const authHeader = req.headers.authorization;
  if (authHeader) {
    const expectedHeader = `Basic ${Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString('base64')}`;
    if (safeEqual(authHeader, expectedHeader)) {
      res.json({ authenticated: true, username: ADMIN_USERNAME });
      return;
    }
  }

  res.status(401).json({ authenticated: false });
});

app.post('/api/admin/login', (req, res) => {
  if (!isAdminConfigured()) {
    res.status(503).json({ error: 'Admin authentication is not configured.' });
    return;
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  if (!safeEqual(username, ADMIN_USERNAME) || !safeEqual(password, ADMIN_PASSWORD)) {
    res.status(401).json({ error: 'Invalid admin credentials' });
    return;
  }

  setAdminSessionCookie(res, username);
  res.json({ success: true, username });
});

app.post('/api/admin/logout', (req, res) => {
  clearAdminSessionCookie(res);
  res.json({ success: true });
});

app.get('/api/messages', requireAdmin, async (req, res) => {
  try {
    const rows = USE_SUPABASE
      ? await supabaseRequest('/rest/v1/messages?select=id,name,email,message,created_at&order=created_at.desc')
      : await getMessagesFromLocalDb();

    res.json(rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages/:id/reply', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;

  if (!reply || !reply.trim()) {
    res.status(400).json({ error: 'Reply message is required' });
    return;
  }

  try {
    if (USE_SUPABASE) {
      await supabaseRequest(`/rest/v1/messages?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ reply: reply.trim(), replied_at: new Date().toISOString() })
      });
      res.json({ success: true });
      return;
    }

    const result = await saveReplyToLocalDb(id, reply.trim());
    if (result.notFound) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/messages/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    if (USE_SUPABASE) {
      await supabaseRequest(`/rest/v1/messages?id=eq.${id}`, { method: 'DELETE' });
      res.json({ success: true });
      return;
    }

    const result = await deleteMessageFromLocalDb(id);
    if (result.notFound) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update message status (read, replied, archived)
app.patch('/api/messages/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['new', 'read', 'replied', 'archived'];
  
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  try {
    if (USE_SUPABASE) {
      await supabaseRequest(`/rest/v1/messages?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, updated_at: new Date().toISOString() })
      });
      res.json({ success: true });
      return;
    }

    const result = await updateMessageStatusInLocalDb(id, status);
    if (result.notFound) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, subject, message, honeypot } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    // Honeypot check: if honeypot field is filled, reject silently
    if (honeypot && honeypot.trim() !== '') {
      res.status(201).json({ success: true, id: null });
      return;
    }

    // Rate limiting
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({ error: 'Too many submissions. Please try again later.' });
      return;
    }

    // Validate all fields present
    if (!name || !email || !subject || !message) {
      res.status(400).json({ error: 'All fields (name, email, subject, message) are required' });
      return;
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedSubject = sanitizeInput(subject);
    const sanitizedMessage = sanitizeInput(message);

    // Validate field lengths
    if (sanitizedName.length === 0 || sanitizedName.length > FIELD_LIMITS.name) {
      res.status(400).json({ error: `Name must be between 1 and ${FIELD_LIMITS.name} characters` });
      return;
    }

    if (sanitizedSubject.length === 0 || sanitizedSubject.length > FIELD_LIMITS.subject) {
      res.status(400).json({ error: `Subject must be between 1 and ${FIELD_LIMITS.subject} characters` });
      return;
    }

    if (sanitizedMessage.length === 0 || sanitizedMessage.length > FIELD_LIMITS.message) {
      res.status(400).json({ error: `Message must be between 1 and ${FIELD_LIMITS.message} characters` });
      return;
    }

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      res.status(400).json({ error: 'Please provide a valid email address' });
      return;
    }

    // Record submission for rate limiting
    recordSubmission(clientIp);

    try {
      let createdMessage = null;

      if (USE_SUPABASE) {
        const insertedRows = await supabaseRequest('/rest/v1/messages', {
          method: 'POST',
          body: JSON.stringify([{ 
            name: sanitizedName, 
            email: sanitizedEmail, 
            subject: sanitizedSubject,
            message: sanitizedMessage,
            status: 'new',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]),
          headers: { Prefer: 'return=representation' }
        });

        createdMessage = { success: true, id: insertedRows?.[0]?.id || null };
      } else {
        createdMessage = await saveMessageToLocalDb(sanitizedName, sanitizedEmail, sanitizedSubject, sanitizedMessage);
      }

      if (createdMessage && createdMessage.success) {
        try {
          await sendContactNotification({
            name: sanitizedName,
            email: sanitizedEmail,
            subject: sanitizedSubject,
            message: sanitizedMessage,
            createdAt: new Date().toISOString()
          });
        } catch (emailError) {
          console.error('Email notification failed:', emailError.message);
        }
      }

      res.status(201).json(createdMessage);
    } catch (dbErr) {
      console.error('Database error:', dbErr.message);
      res.status(500).json({ error: 'Failed to save your message. Please try again later.' });
    }
  } catch (error) {
    console.error('Submission error:', error.message);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

app.get('/api/education', async (req, res) => {
  try {
    const isAdminRequest = isValidAdminRequest(req);
    const rows = await getEducationRecordsFromDb(isAdminRequest);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/education/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM education WHERE id = ?', [id], (err, found) => {
        if (err) reject(err);
        else resolve(found || null);
      });
    });

    if (!row) {
      res.status(404).json({ error: 'Education record not found' });
      return;
    }

    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/education', requireAdmin, async (req, res) => {
  try {
    const payload = sanitizeEducationPayload(req.body || {});
    const insert = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO education (
          degree, institution, college, field_of_study, start_year, end_year, status, grade, location, coursework, achievements, description, logo_url, document_url, published, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          payload.degree,
          payload.institution,
          payload.college,
          payload.field_of_study,
          payload.start_year,
          payload.end_year,
          payload.status,
          payload.grade,
          payload.location,
          payload.coursework,
          payload.achievements,
          payload.description,
          payload.logo_url,
          payload.document_url,
          payload.published
        ],
        function (err) {
          if (err) {
            reject(new Error('Failed to create education record'));
            return;
          }
          resolve({ id: this.lastID, ...payload });
        }
      );
    });

    res.status(201).json(insert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/education/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = sanitizeEducationPayload(req.body || {});

    const result = await new Promise((resolve, reject) => {
      db.run(
        `UPDATE education SET
          degree = ?, institution = ?, college = ?, field_of_study = ?, start_year = ?, end_year = ?, status = ?, grade = ?, location = ?, coursework = ?, achievements = ?, description = ?, logo_url = ?, document_url = ?, published = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          payload.degree,
          payload.institution,
          payload.college,
          payload.field_of_study,
          payload.start_year,
          payload.end_year,
          payload.status,
          payload.grade,
          payload.location,
          payload.coursework,
          payload.achievements,
          payload.description,
          payload.logo_url,
          payload.document_url,
          payload.published,
          id
        ],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.changes);
        }
      );
    });

    if (result === 0) {
      res.status(404).json({ error: 'Education record not found' });
      return;
    }

    res.json({ success: true, id: Number(id) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/education/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await new Promise((resolve, reject) => {
      db.run('DELETE FROM education WHERE id = ?', [id], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);
      });
    });

    if (result === 0) {
      res.status(404).json({ error: 'Education record not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const [professionalIntroduction, careerAvailability, chatbotEnabled, chatbotIntro] = await Promise.all([
      getConfigValue('professional_introduction', PORTFOLIO_PROFILE.intro),
      getConfigValue('career_availability', ''),
      getConfigValue('chatbot_enabled', 'true'),
      getConfigValue('chatbot_intro', 'Hi! 👋 I\'m your AI Portfolio Assistant. I can help you explore my published projects, education, skills, development interests, and professional background. What would you like to know?')
    ]);

    res.json({
      professionalIntroduction,
      careerAvailability,
      chatbotEnabled: chatbotEnabled !== 'false',
      chatbotIntro,
      apiConfigured: Boolean(OPENAI_API_KEY)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const { professionalIntroduction, careerAvailability, chatbotEnabled, chatbotIntro } = req.body || {};

    await Promise.all([
      setConfigValue('professional_introduction', professionalIntroduction || PORTFOLIO_PROFILE.intro),
      setConfigValue('career_availability', careerAvailability || ''),
      setConfigValue('chatbot_enabled', chatbotEnabled === false ? 'false' : 'true'),
      setConfigValue('chatbot_intro', chatbotIntro || 'Hi! 👋 I\'m your AI Portfolio Assistant. I can help you explore my published projects, education, skills, development interests, and professional background. What would you like to know?')
    ]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { message } = req.body || {};
    const text = typeof message === 'string' ? message.trim() : '';

    if (!text) {
      res.status(400).json({ error: 'Please enter a message for the AI assistant.' });
      return;
    }

    if (text.length > 2000) {
      res.status(400).json({ error: 'Messages must be 2000 characters or fewer.' });
      return;
    }

    const chatbotEnabled = await getConfigValue('chatbot_enabled', 'true');
    if (chatbotEnabled === 'false') {
      res.json({
        answer: 'The portfolio assistant is temporarily disabled by the owner. Please use the contact section to reach out directly.',
        provider: 'offline',
        fallbackUsed: true,
        status: 'Assistant disabled.'
      });
      return;
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkChatbotRateLimit(clientIp)) {
      res.status(429).json({ error: 'Too many assistant messages. Please wait a minute and try again.' });
      return;
    }

    const reply = await generateAssistantReply(text);
    res.json(reply);
  } catch (error) {
    res.status(500).json({
      answer: 'I am currently unable to answer right now. Please use the contact form or public profiles to get in touch.',
      provider: 'offline',
      fallbackUsed: true,
      status: error.message || 'Assistant error.'
    });
  }
});

app.get('/api/chatbot/status', async (req, res) => {
  const chatbotEnabled = await getConfigValue('chatbot_enabled', 'true');
  res.json({
    enabled: chatbotEnabled !== 'false',
    apiConfigured: Boolean(OPENAI_API_KEY),
    intro: await getConfigValue('chatbot_intro', 'Hi! 👋 I\'m your AI Portfolio Assistant. I can help you explore my published projects, education, skills, development interests, and professional background. What would you like to know?')
  });
});

app.get('/api/location/latest', async (req, res) => {
  try {
    let row = null;
    if (USE_SUPABASE) {
      const rows = await supabaseRequest('/rest/v1/location?select=lat,lng,accuracy,heading,speed,updated_at');
      row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    } else {
      row = await getLatestLocationFromLocalDb();
    }

    if (!row || row.lat == null || row.lng == null) {
      res.json({ location: null });
      return;
    }

    res.json({ location: row });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/location', requireAdmin, async (req, res) => {
  const { lat, lng, accuracy, heading, speed } = req.body;

  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({ error: 'Valid lat and lng are required' });
    return;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400).json({ error: 'Coordinates are out of range' });
    return;
  }

  try {
    if (USE_SUPABASE) {
      const exists = await supabaseRequest('/rest/v1/location?select=id');

      if (Array.isArray(exists) && exists.length > 0) {
        await supabaseRequest('/rest/v1/location?id=eq.1', {
          method: 'PATCH',
          body: JSON.stringify({
            lat,
            lng,
            accuracy: accuracy || null,
            heading: heading || null,
            speed: speed || null,
            updated_at: new Date().toISOString()
          })
        });
      } else {
        await supabaseRequest('/rest/v1/location', {
          method: 'POST',
          body: JSON.stringify([
            {
              id: 1,
              lat,
              lng,
              accuracy: accuracy || null,
              heading: heading || null,
              speed: speed || null,
              updated_at: new Date().toISOString()
            }
          ])
        });
      }
    } else {
      await saveLocationToLocalDb(lat, lng, accuracy || null, heading || null, speed || null);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  if (USE_SUPABASE) {
    console.log('Supabase storage enabled');
  } else {
    console.log('Using local SQLite storage');
  }
});
