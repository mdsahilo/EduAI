import React from 'react';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Calendar,
  ArrowRight,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { QuizResult, WeakTopicAnalysis, StudyPlan, DocumentItem } from '../types';

interface ProgressDashboardProps {
  quizzes: QuizResult[];
  weakTopics: WeakTopicAnalysis[];
  studyPlan: StudyPlan | null;
  documents: DocumentItem[];
  onReviseTopic?: (topic: string) => void;
  onTakeQuizForTopic?: (topic: string) => void;
}

export const ProgressDashboardView: React.FC<ProgressDashboardProps> = ({
  quizzes,
  weakTopics,
  studyPlan,
  documents,
  onReviseTopic,
  onTakeQuizForTopic,
}) => {
  // Aggregate Metrics
  const totalQuizzesTaken = quizzes.length;
  const overallAverageScore =
    totalQuizzesTaken > 0
      ? Math.round(quizzes.reduce((acc, q) => acc + q.scorePercentage, 0) / totalQuizzesTaken)
      : 0;

  const allTopicStats: { [topic: string]: { correct: number; total: number } } = {};
  quizzes.forEach((quiz) => {
    quiz.questions.forEach((q) => {
      const t = q.topic || 'General';
      if (!allTopicStats[t]) allTopicStats[t] = { correct: 0, total: 0 };
      allTopicStats[t].total += 1;
      if (quiz.userAnswers[q.id] === q.correctAnswer) {
        allTopicStats[t].correct += 1;
      }
    });
  });

  const strongTopics = Object.entries(allTopicStats)
    .filter(([_, stat]) => Math.round((stat.correct / stat.total) * 100) >= 75)
    .map(([topic, stat]) => ({
      topic,
      accuracy: Math.round((stat.correct / stat.total) * 100),
      total: stat.total,
    }));

  const planTasks = studyPlan?.tasks || [];
  const planCompleted = planTasks.filter((t) => t.completed).length;
  const planPercent = planTasks.length > 0 ? Math.round((planCompleted / planTasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/30">
            <TrendingUp className="w-3.5 h-3.5" /> Exam Readiness Analytics
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
            Progress & Diagnostic Dashboard
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Real-time analytics on your quiz accuracy, identified weak revision areas, and progress towards upcoming semester exams.
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Average Score
          </div>
          <div className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {overallAverageScore}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {totalQuizzesTaken} practice tests
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Weak Topics
          </div>
          <div className="text-2xl md:text-3xl font-bold text-amber-600">
            {weakTopics.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Requiring priority revision
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Study Plan
          </div>
          <div className="text-2xl md:text-3xl font-bold text-emerald-600">
            {planPercent}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {planCompleted}/{planTasks.length} tasks finished
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Indexed Material
          </div>
          <div className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">
            {documents.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            College documents uploaded
          </div>
        </div>
      </div>

      {/* Weak Topics Section - CRITICAL REQUIREMENT */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Detected Weak Topics & Action Recommendations
              </h3>
              <p className="text-xs text-slate-500">
                Automated diagnostics based on your incorrect quiz responses (&lt; 70% accuracy)
              </p>
            </div>
          </div>
        </div>

        {weakTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weakTopics.map((wt, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                      Accuracy: {wt.accuracy}%
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                      {wt.topic}
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400">
                    Tested: {wt.totalQuestions} Qs
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Recommendation: </span>
                  {wt.recommendation}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {onReviseTopic && (
                    <button
                      onClick={() => onReviseTopic(wt.topic)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:underline"
                    >
                      Ask AI Tutor →
                    </button>
                  )}
                  {onTakeQuizForTopic && (
                    <button
                      onClick={() => onTakeQuizForTopic(wt.topic)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Targeted Quiz
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No weak topics detected!
            </div>
            <p className="text-xs text-slate-500">
              You scored above 70% in all tested topics so far, or have not taken diagnostic tests yet.
            </p>
          </div>
        )}
      </div>

      {/* Strong Topics & Subject Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Topics */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Strong Topics (Exam Ready)
            </h3>
          </div>

          {strongTopics.length > 0 ? (
            <div className="space-y-2">
              {strongTopics.map((st, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{st.topic}</span>
                  <span className="font-bold text-emerald-600">{st.accuracy}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Complete more quizzes to identify strong topics.</p>
          )}
        </div>

        {/* Recent Quiz Logs */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Quiz History
            </h3>
          </div>

          <div className="space-y-2">
            {quizzes.slice(0, 4).map((q) => (
              <div
                key={q.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {q.docTitle}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(q.date).toLocaleDateString()} • {q.correctCount}/{q.totalQuestions} correct
                  </div>
                </div>

                <div
                  className={`font-bold ${
                    q.scorePercentage >= 70 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {q.scorePercentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
