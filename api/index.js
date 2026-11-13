import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { Groq } from 'groq-sdk';
import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured.');
}

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
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// ── Auth ──
function validateCredentials(req, res, next) {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || !email.trim() ||
      typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  next();
}

app.post('/api/auth/register', validateCredentials, async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username as name, email',
      [name || email, email, hashedPassword]
    );
    const user = result.rows[0];
    const token = jwt.sign({ sub: user.name, id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ message: 'User registered successfully', token, user });
  } catch (err) {
    res.status(400).json({ message: 'Email already exists' });
  }
});

app.post('/api/auth/login', validateCredentials, async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid email or password' });
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
    const token = jwt.sign({ sub: user.username, id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
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
        const demoPassword = await bcrypt.hash('demo', 10);
        const insertRes = await query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *', ['demouser', 'demo@orator.app', demoPassword]);
        user = insertRes.rows[0];
    } else {
        user = result.rows[0];
    }
    const token = jwt.sign({ sub: user.username, id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
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
  const { jobRole, technology, experienceLevel } = req.body || {};
  const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0;
  if (!isNonEmptyString(jobRole) || !isNonEmptyString(technology) ||
      (experienceLevel !== undefined && !isNonEmptyString(experienceLevel))) {
    return res.status(400).json({ message: 'Job role and technology must be non-empty strings; experience level must be a non-empty string when provided' });
  }
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
    const history = result.rows.map(row => {
      const data = JSON.parse(row.assessment_data);
      return {
        id: row.id,
        jobRole: row.job_role,
        technology: row.technology,
        experienceLevel: row.experience_level,
        questions: data.questions,
        assessmentData: data,
        score: row.score,
        cheatingDetected: row.cheating_detected,
        createdAt: row.created_at
      }
    });
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
      questions: session.assessment_data.questions, evaluation: session.assessment_data.evaluation, score: session.score, cheatingDetected: session.cheating_detected
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get session' });
  }
});

app.post('/api/questions/session/:id/assess', authenticate, async (req, res) => {
  const { answers } = req.body;
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ message: "API Key missing" });
  
  try {
    const result = await query('SELECT * FROM assessments WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Session not found' });
    const session = result.rows[0];
    const assessmentData = JSON.parse(session.assessment_data);
    const questions = assessmentData.questions;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const prompt = `You are an expert technical interviewer evaluating a candidate.
Here are the questions and the candidate's answers:
${questions.map(q => {
  const ans = answers[q.id || q];
  return `Q ID: ${q.id || q}\nQuestion: ${q.question || q}\nAnswer: ${ans ? ans.text : 'No answer'}\nPaste Count: ${ans ? ans.pasteCount : 0}\nTab Switches: ${ans ? ans.tabSwitches : 0}`;
}).join('\n\n')}

Return the output AS A STRICT JSON OBJECT exactly matching this schema:
{
  "overallScore": number (0-100),
  "overallFeedback": "string",
  "questionAssessments": [
    {
      "questionId": "string (the Q ID)",
      "score": number (0-10),
      "feedback": "string",
      "isAiGenerated": boolean (true if cheating suspected based on pastes/tabs or text),
      "aiReasoning": "string"
    }
  ]
}
Do not include any markdown, backticks, or conversational text. Return ONLY JSON.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }], model: "llama-3.1-8b-instant", temperature: 0.3,
    });
    
    let resultText = chatCompletion.choices[0].message.content.trim();
    if (resultText.startsWith("```json")) resultText = resultText.substring(7);
    if (resultText.startsWith("```")) resultText = resultText.substring(3);
    if (resultText.endsWith("```")) resultText = resultText.substring(0, resultText.length - 3);
    
    const evaluation = JSON.parse(resultText.trim());
    const isCheating = evaluation.questionAssessments.some(qa => qa.isAiGenerated);
    
    assessmentData.evaluation = evaluation;
    await query('UPDATE assessments SET score = $1, cheating_detected = $2, assessment_data = $3 WHERE id = $4', [evaluation.overallScore, isCheating, JSON.stringify(assessmentData), session.id]);
    
    res.status(200).json(evaluation);
  } catch (err) {
    console.error('Assessment error:', err);
    res.status(500).json({ message: 'Failed to submit assessment' });
  }
});

// Create favorites table route
app.get('/api/init-db', async (req, res) => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        question_id VARCHAR(255) NOT NULL,
        question_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, question_id)
      );
    `);
    res.status(200).json({ message: 'Table created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Favorites endpoints
app.post('/api/favorites/:id', authenticate, async (req, res) => {
  try {
    const questionId = req.params.id;
    // We need to fetch the question data from previous assessments
    const result = await query('SELECT assessment_data FROM assessments WHERE user_id = $1', [req.user.id]);
    let questionToSave = null;
    for (const row of result.rows) {
      const data = JSON.parse(row.assessment_data);
      const q = data.questions.find(x => x.id === questionId);
      if (q) { questionToSave = q; break; }
    }
    if (!questionToSave) return res.status(404).json({ message: 'Question not found' });

    await query(
      'INSERT INTO favorites (user_id, question_id, question_data) VALUES ($1, $2, $3) ON CONFLICT (user_id, question_id) DO NOTHING',
      [req.user.id, questionId, JSON.stringify(questionToSave)]
    );
    res.status(200).json({ message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add favorite' });
  }
});

app.delete('/api/favorites/:id', authenticate, async (req, res) => {
  try {
    await query('DELETE FROM favorites WHERE user_id = $1 AND question_id = $2', [req.user.id, req.params.id]);
    res.status(200).json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove favorite' });
  }
});

app.get('/api/favorites', authenticate, async (req, res) => {
  try {
    const parsePagination = (value, fallback) => {
      if (value === undefined) return fallback;
      if (typeof value !== 'string' || !/^\d+$/.test(value)) return NaN;
      return Number(value);
    };
    const page = parsePagination(req.query.page, 0);
    const size = parsePagination(req.query.size, 20);
    const offset = page * size;
    if (!Number.isSafeInteger(page) || page < 0 ||
        !Number.isSafeInteger(size) || size < 1 ||
        !Number.isSafeInteger(offset)) {
      return res.status(400).json({ message: 'Invalid pagination parameters' });
    }
    const countResult = await query('SELECT COUNT(*) FROM favorites WHERE user_id = $1', [req.user.id]);
    const totalElements = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalElements / size);
    
    const result = await query('SELECT question_data FROM favorites WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [req.user.id, size, offset]);
    const content = result.rows.map(row => JSON.parse(row.question_data));
    
    res.status(200).json({ content, totalPages, totalElements });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get favorites' });
  }
});

export default app;
