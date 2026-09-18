export interface DocumentItem {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  pageCount: number;
  extractedText: string;
  summary?: string;
  topics?: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  source?: 'document' | 'general';
  referencedDocName?: string;
  modeTag?: string; // e.g. 'Simple Explanation', '5-Mark Answer'
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-3
  explanation: string;
  topic: string;
}

export interface QuizResult {
  id: string;
  docId?: string;
  docTitle?: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  date: string;
  userAnswers: { [questionId: string]: number };
  questions: QuizQuestion[];
  topicScores: { [topic: string]: { correct: number; total: number; percentage: number } };
}

export interface ImportantQuestionItem {
  id: string;
  question: string;
  priority: 'Very Important' | 'Important' | 'Revision';
  marksRecommendation: '2 Marks' | '5 Marks' | '10 Marks';
  topic: string;
  sampleKeyPoints: string[];
  reason: string;
}

export interface StudyTask {
  id: string;
  day: number;
  dateStr: string;
  title: string;
  subject: string;
  estimatedHours: number;
  topics: string[];
  completed: boolean;
}

export interface StudyPlan {
  id: string;
  examDate: string;
  subjects: string[];
  availableHoursPerDay: number;
  topics: string[];
  preparationLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  createdAt: string;
  tasks: StudyTask[];
  spreadsheetUrl?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  college?: string;
  major?: string;
  year?: string;
  joinedAt: string;
}

export interface WeakTopicAnalysis {
  topic: string;
  subject?: string;
  accuracy: number;
  totalQuestions: number;
  recommendation: string;
  priority: 'High' | 'Medium';
}
