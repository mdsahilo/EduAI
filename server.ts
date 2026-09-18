import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set. AI requests will fail until configured.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

function cleanAndParseJson<T>(raw: string, fallback: T): T {
  try {
    let clean = (raw || '').trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/i, '').replace(/\s*```$/, '');
    }
    return JSON.parse(clean);
  } catch (err) {
    const firstBracket = (raw || '').indexOf('[');
    const lastBracket = (raw || '').lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(raw.substring(firstBracket, lastBracket + 1));
      } catch {}
    }
    const firstBrace = (raw || '').indexOf('{');
    const lastBrace = (raw || '').lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(raw.substring(firstBrace, lastBrace + 1));
      } catch {}
    }
    return fallback;
  }
}

async function generateContentWithRetry(params: any, retries = 1, initialDelay = 1000): Promise<any> {
  const ai = getAI();
  const primaryModel = params.model || 'gemini-3.8-flash';
  const modelsToTry = [primaryModel, 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let delay = initialDelay;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await ai.models.generateContent({
          ...params,
          model: model,
        });
      } catch (error: any) {
        lastError = error;
        const errStr = String(error?.message || error || '');
        const isRetryable =
          error?.status === 'UNAVAILABLE' ||
          error?.code === 503 ||
          error?.status === 503 ||
          error?.status === 'RESOURCE_EXHAUSTED' ||
          error?.code === 429 ||
          errStr.includes('503') ||
          errStr.includes('high demand') ||
          errStr.includes('UNAVAILABLE') ||
          errStr.includes('RESOURCE_EXHAUSTED');

        if (isRetryable && attempt < retries) {
          console.warn(`Gemini API temporary issue on ${model}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 1.5;
          continue;
        }
        // If not retryable or max attempts on this model reached, try next model in loop
        break;
      }
    }
  }
  throw lastError;
}

const app = express();
const PORT = 3000;

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

app.use(express.json({ limit: '65mb' }));
app.use(express.urlencoded({ limit: '65mb', extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    maxUploadSizeBytes: MAX_FILE_SIZE_BYTES,
    time: new Date().toISOString(),
  });
});

// Document Upload Validation Route
app.post('/api/documents/validate', (req, res) => {
  const { fileName, fileSize } = req.body;
  if (!fileName || !fileName.toLowerCase().endsWith('.pdf')) {
    return res.status(400).json({ valid: false, error: 'Please upload a valid PDF file (.pdf extension).' });
  }
  if (fileSize && Number(fileSize) > MAX_FILE_SIZE_BYTES) {
    return res.status(400).json({ valid: false, error: 'File is too large. Please upload a PDF smaller than 50MB.' });
  }
  return res.json({ valid: true, maxSizeBytes: MAX_FILE_SIZE_BYTES });
});

// AI Tutor / Q&A Route
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { prompt, documentText, docName, mode, conversationHistory } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getAI();
    const systemPrompt = `You are "EduAI", an intelligent, empathetic, and highly capable college tutor and exam preparation assistant.
Your student is preparing for college university exams.

DOCUMENT CONTEXT:
${documentText ? `Uploaded Document: "${docName || 'Study Material'}"\nExtracted Material:\n${documentText.slice(0, 45000)}` : 'No document uploaded. Use general standard academic knowledge.'}

CRITICAL INSTRUCTIONS:
1. When document context is provided:
   - Carefully check if the student's question can be answered from the uploaded document text.
   - If the uploaded study material contains the answer, answer thoroughly based on that material. State explicitly at the start or in your response: "[Source: Uploaded Document: ${docName || 'PDF'}]".
   - If the question CANNOT be found in the uploaded material, clearly tell the student:
     "⚠️ Note: This specific topic was not found in your uploaded study material (${docName || 'PDF'}). Providing standard college syllabus guidance from general knowledge:" and then explain clearly. NEVER fabricate or pretend information came from the document if it did not.
2. Mode rules:
   - "Simple Explanation": Explain in very simple, conversational language suitable for a college student, using relatable everyday analogies and intuitive examples.
   - "Detailed Explanation": Provide in-depth academic depth with definitions, architectural/theoretical breakdown, formulas/protocols, advantages, and limitations.
   - "Example": Provide comprehensive, realistic code/numeric/real-world examples with step-by-step walkthroughs.
   - "Summary": Give a concise bulleted summary of the core concepts, exam keywords, and quick recap.
   - "2-Mark Answer": Concise, crisp definition + 2 key points or formula, ideal for quick 2-mark university questions.
   - "5-Mark Answer": Clear heading, formal definition, 4-5 well-structured bullet points, diagram description (if applicable), and brief example.
   - "10-Mark Answer": Comprehensive university essay format with Introduction, Architectural/Conceptual Overview, Detailed Key Components/Steps, Working Mechanism, Comparative Analysis/Pros & Cons, Real-world Example, and Conclusion.
3. Tone: Encouraging, rigorous, student-friendly, and structured with clear markdown formatting (bolding, lists, code blocks).`;

    const contents: any[] = [];
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-6)) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }
    }
    
    // Add current prompt
    let userMessage = prompt;
    if (mode && mode !== 'Standard') {
      userMessage = `[Requested Format: ${mode}]\n${prompt}`;
    }
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      },
    });

    const answerText = response.text || 'Unable to generate response.';
    const isDocSourced = Boolean(documentText && !answerText.includes('not found in your uploaded study material'));

    res.json({
      answer: answerText,
      source: isDocSourced ? 'document' : 'general',
      docName: docName || null,
      mode: mode || 'Standard',
    });
  } catch (error: any) {
    console.error('AI Ask error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI response' });
  }
});

// Exam Answer Generator Route
app.post('/api/ai/exam-answer', async (req, res) => {
  try {
    const { question, marks, documentText, docName } = req.body;
    if (!question || !marks) {
      return res.status(400).json({ error: 'Question and marks value are required' });
    }

    const systemPrompt = `You are EduAI's specialized College Exam Answer Generator.
The user is preparing for university examination papers where marks determine answer depth and structure.

Marks target: ${marks} Marks.

RULES FOR COLLEGE EXAM MARK SCHEMES:
- If 2 Marks:
  * 1 crisp definition or statement.
  * 2 bullet points highlighting key aspects/formula/facts.
  * Total length: 50-80 words.
  * Direct, to the point. No fluff.

- If 5 Marks:
  * Structure:
    1. Introduction / Core Definition (1-2 lines)
    2. Key Principles / Functional Components (4-5 bullet points with bold subheadings)
    3. Diagram Representation / Schematic ASCII or flowchart description
    4. Practical Example or Application
  * Total length: 150-250 words.

- If 10 Marks:
  * Structure:
    1. Title & Introduction (Objective, context, university-standard definition)
    2. Detailed Architecture / Theoretical Framework (In-depth analysis)
    3. Step-by-Step Working Mechanism / Protocol / Algorithm
    4. Key Characteristics & Trade-offs (Strengths, Weaknesses, Edge cases)
    5. Real-World Case Study / Concrete Example
    6. Summary / Conclusion (High-scoring conclusion paragraph)
  * Total length: 450-700 words.

Document context:
${documentText ? `Reference Material ("${docName}"):\n${documentText.slice(0, 40000)}` : 'Answer using standard accredited university curriculum.'}

Format using clean Markdown with clear headings and readable bullet points. Avoid filler words.`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: `Generate a high-scoring ${marks}-mark examination answer for the following question:\n"${question}"` }] }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });

    res.json({
      answer: response.text || 'Unable to generate exam answer.',
      marks,
      question,
    });
  } catch (error: any) {
    console.error('Exam answer error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate exam answer' });
  }
});

// MCQ Quiz Generator Route
app.post('/api/ai/quiz', async (req, res) => {
  try {
    const { documentText, docName, questionCount = 5, difficulty = 'Medium', topic } = req.body;
    if (!documentText && !topic) {
      return res.status(400).json({ error: 'Document text or specific topic required' });
    }

    const prompt = `Generate a university-level Multiple Choice Question (MCQ) quiz based on the following material.
Target Question Count: ${questionCount}
Difficulty: ${difficulty}
Specific Topic Focus: ${topic || 'Cover key topics across the material'}

STUDY MATERIAL:
${documentText ? documentText.slice(0, 40000) : `Topic: ${topic}`}

CRITICAL REQUIREMENTS:
- Provide exactly ${questionCount} realistic, high-quality college exam MCQs.
- Avoid obvious "All of the above" or trick questions unless academically standard.
- Return ONLY a valid JSON array of objects conforming to this schema, with no markdown code fence ticks if possible or standard json blocks:
[
  {
    "id": "q1",
    "question": "Question text here?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": 0, // 0 for Option A, 1 for B, 2 for C, 3 for D
    "explanation": "Clear explanation of why this answer is correct and why other options are incorrect.",
    "topic": "Specific Topic or Subtopic name (e.g., Normalization, TCP Handshake, Cache Memory)"
  }
]`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const questions = cleanAndParseJson(response.text || '[]', []);
    res.json({ questions });
  } catch (error: any) {
    console.error('Quiz generator error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate quiz' });
  }
});

// Important Questions Analyzer
app.post('/api/ai/important-questions', async (req, res) => {
  try {
    const { documentText, docName } = req.body;
    if (!documentText) {
      return res.status(400).json({ error: 'Document text required' });
    }

    const prompt = `Analyze this college syllabus/lecture notes document: "${docName}".
Identify high-frequency, critical examination questions commonly asked in college semester exams.
Categorize them into 3 distinct preparation priorities:
1. "Very Important" (Core fundamentals, repeatedly tested 10-mark or 5-mark concepts)
2. "Important" (Key mechanisms, algorithms, comparisons, 5-mark questions)
3. "Revision" (Definitions, quick 2-mark questions, edge formulas, conceptual checks)

STUDY MATERIAL:
${documentText.slice(0, 45000)}

Return ONLY a valid JSON array matching this exact schema:
[
  {
    "id": "iq_1",
    "question": "Question phrasing as typically seen in college exam papers",
    "priority": "Very Important" | "Important" | "Revision",
    "marksRecommendation": "2 Marks" | "5 Marks" | "10 Marks",
    "topic": "Specific Subtopic Name",
    "sampleKeyPoints": ["Crucial keyword/point 1", "Crucial keyword/point 2", "Diagram recommendation"],
    "reason": "Why this question is a high exam priority"
  }
]
Generate between 6 and 12 questions with balanced coverage.`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const importantQuestions = cleanAndParseJson(response.text || '[]', []);
    res.json({ questions: importantQuestions });
  } catch (error: any) {
    console.error('Important questions error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate important questions' });
  }
});

// Study Planner AI Generator
app.post('/api/ai/study-plan', async (req, res) => {
  try {
    const { examDate, subjects, availableHoursPerDay, topics, preparationLevel } = req.body;
    if (!examDate || !subjects) {
      return res.status(400).json({ error: 'Exam date and subjects are required' });
    }

    const prompt = `You are EduAI's expert academic schedule advisor.
Create a realistic, high-impact day-by-day study schedule for a college student leading up to their exam.

Student Parameters:
- Exam Date: ${examDate}
- Current Date: ${new Date().toISOString().split('T')[0]}
- Subjects: ${Array.isArray(subjects) ? subjects.join(', ') : subjects}
- Available Study Hours Per Day: ${availableHoursPerDay} hours
- Specific Topics/Chapters: ${Array.isArray(topics) ? topics.join(', ') : (topics || 'Comprehensive syllabus')}
- Current Preparation Level: ${preparationLevel} (e.g. Beginner, Intermediate, Advanced)

Generate between 5 to 14 realistic scheduled study days/tasks (spanning now until exam eve).
Include revision days, mock quiz slots, and active recall checkpoints.

Return ONLY a valid JSON array of tasks conforming to this schema:
[
  {
    "id": "task_1",
    "day": 1,
    "dateStr": "YYYY-MM-DD",
    "title": "Topic & Focus Action (e.g., Deep Dive: TCP Congestion & Sliding Window)",
    "subject": "Subject Name",
    "estimatedHours": 2.5,
    "topics": ["Subtopic 1", "Subtopic 2"],
    "completed": false
  }
]`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const tasks = cleanAndParseJson(response.text || '[]', []);
    res.json({ tasks });
  } catch (error: any) {
    console.error('Study plan error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate study plan' });
  }
});

// Document Summary & Key Topics extractor
app.post('/api/ai/process-document', async (req, res) => {
  try {
    const contentLength = req.headers['content-length'] ? parseInt(req.headers['content-length'], 10) : 0;
    if (contentLength > MAX_FILE_SIZE_BYTES) {
      return res.status(413).json({ error: 'File is too large. Please upload a PDF smaller than 50MB.' });
    }

    const { documentText, docName, fileSize } = req.body;
    if (fileSize && Number(fileSize) > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({ error: 'File is too large. Please upload a PDF smaller than 50MB.' });
    }
    if (!documentText) {
      return res.status(400).json({ error: 'Document text required' });
    }

    const prompt = `Analyze this college document: "${docName}".
1. Generate an executive 2-paragraph student-friendly summary.
2. Extract the top 4 to 8 primary syllabus topics/modules contained in this text.

STUDY MATERIAL:
${documentText.slice(0, 35000)}

Return ONLY a valid JSON object:
{
  "summary": "Student-friendly summary text...",
  "topics": ["Topic 1", "Topic 2", "Topic 3"]
}`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const result = cleanAndParseJson(response.text || '{}', { summary: '', topics: [] });
    res.json(result);
  } catch (error: any) {
    console.error('Process document error:', error);
    res.status(500).json({ error: error.message || 'Failed to process document' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduAI Server running on port ${PORT}`);
  });
}

startServer();
