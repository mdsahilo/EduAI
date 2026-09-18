import React from 'react';
import {
  Sparkles,
  UploadCloud,
  Bot,
  FileQuestion,
  CheckSquare,
  CalendarCheck,
  TrendingUp,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Award,
  CheckCircle2
} from 'lucide-react';
import { DocumentItem, QuizResult, StudyPlan, WeakTopicAnalysis } from '../types';
import { useAuth } from '../context/AuthContext';
import { TabType } from './Sidebar';

interface DashboardHomeProps {
  documents: DocumentItem[];
  activeDocument: DocumentItem | null;
  quizzes: QuizResult[];
  weakTopics: WeakTopicAnalysis[];
  studyPlan: StudyPlan | null;
  onNavigate: (tab: TabType) => void;
  onSelectDoc: (doc: DocumentItem) => void;
  onTriggerUpload: () => void;
  onReviseTopic: (topic: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  documents,
  activeDocument,
  quizzes,
  weakTopics,
  studyPlan,
  onNavigate,
  onSelectDoc,
  onTriggerUpload,
  onReviseTopic,
}) => {
  const { user } = useAuth();

  const quickActions = [
    { label: 'Upload PDF', icon: '📄', desc: 'Add notes or syllabus', tab: 'documents' as TabType, onClick: onTriggerUpload },
    { label: 'Ask AI Tutor', icon: '🤖', desc: 'Ask about your notes', tab: 'tutor' as TabType },
    { label: 'Generate Quiz', icon: '📝', desc: 'Test chapter retention', tab: 'quiz' as TabType },
    { label: 'Exam Answers', icon: '✍️', desc: '2, 5, or 10-mark formats', tab: 'exam-answer' as TabType },
    { label: 'Important Qs', icon: '📋', desc: 'Semester exam priorities', tab: 'important-questions' as TabType },
    { label: 'Study Plan', icon: '🎯', desc: 'Adaptive exam schedule', tab: 'study-plan' as TabType },
  ];

  const todayTasks = studyPlan?.tasks.filter((t) => !t.completed).slice(0, 3) || [];
  const latestQuiz = quizzes[0] || null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-sm border border-indigo-800/40">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5" /> Intelligent College Exam Companion
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.displayName || 'Student'}!
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            EduAI is ready to assist you. Study directly from your uploaded lecture notes, simulate university exam questions, and target weak preparation areas.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('tutor')}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              Open AI Tutor
            </button>
            <button
              onClick={() => onNavigate('quiz')}
              className="py-2.5 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all border border-white/10 flex items-center gap-2"
            >
              <FileQuestion className="w-4 h-4" />
              Take Practice Quiz
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (action.onClick) action.onClick();
                else onNavigate(action.tab);
              }}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700 shadow-sm hover:shadow transition-all text-left group flex flex-col justify-between"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {action.label}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1">
                  {action.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Weak Topics + Today's Study Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weak Topics Diagnostic Alert Card */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Weak Topics Analysis
                </h3>
                <p className="text-[11px] text-slate-500">
                  Priority areas requiring revision before your exams
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('progress')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              View All →
            </button>
          </div>

          {weakTopics.length > 0 ? (
            <div className="space-y-2.5">
              {weakTopics.slice(0, 3).map((wt, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {wt.topic}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Accuracy: <span className="font-semibold text-red-600">{wt.accuracy}%</span> • {wt.totalQuestions} questions tested
                    </div>
                  </div>

                  <button
                    onClick={() => onReviseTopic(wt.topic)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold text-xs hover:bg-indigo-100 transition-colors"
                  >
                    Revise with AI
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No weak topics flagged
              </div>
              <p className="text-[11px] text-slate-400">
                Your tested quiz accuracy is high. Keep practicing!
              </p>
            </div>
          )}
        </div>

        {/* Study Planner: Today's Tasks */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Study Plan Checkpoints
                </h3>
                <p className="text-[11px] text-slate-500">
                  {studyPlan ? `Exam Date: ${studyPlan.examDate}` : 'No active study schedule'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('study-plan')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              {studyPlan ? 'View Schedule →' : 'Create Plan →'}
            </button>
          </div>

          {todayTasks.length > 0 ? (
            <div className="space-y-2.5">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                      Day {task.day} • {task.dateStr}
                    </span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {task.title}
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                    {task.estimatedHours} hrs
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {studyPlan ? 'All planned tasks completed!' : 'No custom plan set up yet'}
              </p>
              <button
                onClick={() => onNavigate('study-plan')}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                Configure Study Plan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Study Materials Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Study Materials & PDFs
            </h3>
          </div>
          <button
            onClick={() => onNavigate('documents')}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Manage Documents ({documents.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {documents.map((doc) => {
            const isActive = activeDocument?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 bg-slate-50 dark:bg-slate-800/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{doc.pageCount} Pages</span>
                    {isActive && (
                      <span className="text-[10px] font-bold text-indigo-600">Active</span>
                    )}
                  </div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1" title={doc.name}>
                    {doc.name}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span>Ask AI Tutor</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
