import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { Groq } from 'groq-sdk';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const query = (text, params) => pool.query(text, params);

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// ── Auth ──
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username as name, email',
      [name || email, email, hashedPassword]
    );
    const user = result.rows[0];
    const token = jwt.sign({ sub: user.name, id: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
    res.status(201).json({ message: 'User registered successfully', token, user });
  } catch (err) {
    res.status(400).json({ message: 'Email already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid email or password' });
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
    const token = jwt.sign({ sub: user.username, id: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
    res.status(200).json({ token, user: { id: user.id, name: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/api/auth/demo', async (req, res) => {
  try {
    let user;
    const result = await query('SELECT * FROM users WHERE username = $1', ['demouser']);
    if (result.rows.length === 0) {
        const insertRes = await query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *', ['demouser', 'demo@orator.app', 'demo']);
        user = insertRes.rows[0];
    } else {
        user = result.rows[0];
    }
    const token = jwt.sign({ sub: user.username, id: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
    res.status(200).json({ token, user: { id: user.id, name: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.status(200).json({ username: req.user.sub, name: req.user.sub, id: req.user.id });
});

// ── Options ──
app.get('/api/reference/job-roles', (req, res) => {
  res.status(200).json(["Frontend Developer", "Backend Developer", "Full Stack Developer", "DevOps Engineer", "Data Scientist", "Machine Learning Engineer", "Mobile App Developer"]);
});

app.get('/api/reference/technologies', (req, res) => {
  res.status(200).json(["Java", "Python", "JavaScript", "TypeScript", "C#", "C++", "Ruby", "Go", "Spring Boot", "React", "Angular", "Vue.js", "Node.js"]);
});

// ── Assessments ──
app.post('/api/questions/generate', authenticate, async (req, res) => {
  const { jobRole, technology, experienceLevel } = req.body;
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ message: "API Key missing" });
  
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = `Generate exactly 5 highly technical interview questions for a ${jobRole} focusing on ${technology} with ${experienceLevel}. Return the output AS A STRICT JSON ARRAY OF OBJECTS. Each object must have the keys: "id" (a random unique string), "question" (the text), "difficulty" ("Easy", "Medium", or "Hard"), and "category" (e.g., "Technical"). Do not include markdown, backticks, or conversational text.`;
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }], model: "llama-3.1-8b-instant", temperature: 0.5,
    });
    let resultText = chatCompletion.choices[0].message.content.trim();
    if (resultText.startsWith("```json")) resultText = resultText.substring(7);
    if (resultText.startsWith("```")) resultText = resultText.substring(3);
    if (resultText.endsWith("```")) resultText = resultText.substring(0, resultText.length - 3);
    
    let questions = JSON.parse(resultText.trim());
    // Fallback if AI returns strings instead of objects
    if (questions.length > 0 && typeof questions[0] === 'string') {
        questions = questions.map((q, i) => ({ id: `q_${i}`, question: q, difficulty: 'Medium', category: 'Technical' }));
    }
    
    const result = await query(
      'INSERT INTO assessments (user_id, job_role, technology, experience_level, assessment_data, score, cheating_detected) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [req.user.id, jobRole, technology, experienceLevel || 'Mid Level', JSON.stringify({ questions }), null, false]
    );
    res.status(200).json({ sessionId: result.rows[0].id, questions });
  } catch (err) {
    console.error("Groq Generation Error:", err);
    res.status(500).json({ message: 'Failed to generate session', error: err.message });
  }
});

app.get('/api/questions/history', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM assessments WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    const history = result.rows.map(row => ({ ...row, assessment_data: JSON.parse(row.assessment_data) }));
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

app.get('/api/questions/session/:id', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM assessments WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Session not found' });
    const session = result.rows[0];
    session.assessment_data = JSON.parse(session.assessment_data);
    res.status(200).json({
      id: session.id, jobRole: session.job_role, technology: session.technology, experienceLevel: session.experience_level,
      questions: session.assessment_data.questions, score: session.score, cheatingDetected: session.cheating_detected
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get session' });
  }
});

app.post('/api/questions/session/:id/assess', authenticate, async (req, res) => {
  const { answers, cheatingDetected } = req.body;
  try {
    // Generate a random score for this demo endpoint
    const score = Math.floor(Math.random() * (100 - 60 + 1) + 60);
    const feedback = [{ question: "Good job", feedback: "Well done" }];
    await query('UPDATE assessments SET score = $1, cheating_detected = $2 WHERE id = $3 AND user_id = $4', [score, cheatingDetected, req.params.id, req.user.id]);
    res.status(200).json({ overallScore: score, questionsFeedback: feedback });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit' });
  }
});

export default app;
