import React, { useState } from 'react';
import {
  FileQuestion,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Award,
  ArrowRight,
  TrendingDown,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DocumentItem, QuizQuestion, QuizResult } from '../types';
import { StorageService } from '../lib/storage';
import { useAuth } from '../context/AuthContext';

interface McqQuizProps {
  documents: DocumentItem[];
  activeDocument: DocumentItem | null;
  onQuizFinished?: (result: QuizResult) => void;
  onNavigateToTutor?: (topic: string) => void;
}

export const McqQuizGenerator: React.FC<McqQuizProps> = ({
  documents,
  activeDocument,
  onQuizFinished,
  onNavigateToTutor,
}) => {
  const { user } = useAuth();
  const [selectedDocId, setSelectedDocId] = useState<string>(activeDocument?.id || (documents[0]?.id || ''));
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [topicFocus, setTopicFocus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Active Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: number }>({});
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const currentDoc = documents.find((d) => d.id === selectedDocId) || activeDocument;

  const handleGenerateQuiz = async () => {
    setLoading(true);
    setError('');
    setQuizQuestions(null);
    setUserAnswers({});
    setQuizCompleted(false);
    setQuizResult(null);
    setCurrentIdx(0);

    try {
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: currentDoc?.extractedText || '',
          docName: currentDoc?.name || '',
          questionCount: questionCount,
          difficulty: difficulty,
          topic: topicFocus.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Quiz generation failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('AI was unable to generate valid quiz questions from this document.');
      }

      setQuizQuestions(data.questions);
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setError(err.message || 'Failed to generate quiz. Please check server or try a smaller chapter.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionIdx: number) => {
    if (!quizQuestions || quizCompleted) return;
    const currQ = quizQuestions[currentIdx];
    setUserAnswers((prev) => ({
      ...prev,
      [currQ.id]: optionIdx,
    }));
  };

  const handleFinishQuiz = () => {
    if (!quizQuestions) return;

    let correct = 0;
    const topicScores: { [topic: string]: { correct: number; total: number; percentage: number } } = {};

    quizQuestions.forEach((q) => {
      const t = q.topic || 'General';
      if (!topicScores[t]) {
        topicScores[t] = { correct: 0, total: 0, percentage: 0 };
      }
      topicScores[t].total += 1;

      const isCorrect = userAnswers[q.id] === q.correctAnswer;
      if (isCorrect) {
        correct += 1;
        topicScores[t].correct += 1;
      }
    });

    Object.keys(topicScores).forEach((t) => {
      topicScores[t].percentage = Math.round((topicScores[t].correct / topicScores[t].total) * 100);
    });

    const percentage = Math.round((correct / quizQuestions.length) * 100);

    const result: QuizResult = {
      id: 'quiz_' + Date.now(),
      docId: currentDoc?.id,
      docTitle: currentDoc?.name || 'Academic Quiz',
      totalQuestions: quizQuestions.length,
      correctCount: correct,
      scorePercentage: percentage,
      date: new Date().toISOString(),
      userAnswers: userAnswers,
      questions: quizQuestions,
      topicScores: topicScores,
    };

    setQuizResult(result);
    setQuizCompleted(true);

    if (user?.uid) {
      StorageService.saveQuizResult(user.uid, result);
    }
    onQuizFinished?.(result);

    // Trigger celebration if passed well
    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-sm border border-emerald-800/40">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-400/30">
            <Award className="w-3.5 h-3.5" /> MCQ Diagnostic Engine
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
            AI Quiz & MCQ Generator
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Generate customized, university-standard multiple choice question papers directly from your uploaded lecture notes. Detect weak topics and receive instant rationales.
          </p>
        </div>
      </div>

      {!quizQuestions ? (
        /* Quiz Generation Form */
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-indigo-600" />
            Configure Your Practice Quiz
          </h3>

          {/* Select Study Doc */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Select Study Document</span>
              {currentDoc && <span className="text-[11px] text-indigo-600 font-medium">{currentDoc.name}</span>}
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    📄 {doc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Number of Questions & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Number of Questions
              </label>
              <div className="flex gap-2">
                {[5, 10, 15].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      questionCount === count
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Difficulty Level
              </label>
              <div className="flex gap-2">
                {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      difficulty === diff
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Topic Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Specific Topic or Subtopic (Optional)
            </label>
            <input
              type="text"
              value={topicFocus}
              onChange={(e) => setTopicFocus(e.target.value)}
              placeholder="e.g. Normalization, TCP Congestion, Subnetting"
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerateQuiz}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Synthesizing {questionCount} College Exam MCQs...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate MCQs from Document
              </>
            )}
          </button>
        </div>
      ) : !quizCompleted ? (
        /* Active Quiz Question Card */
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Question {currentIdx + 1} of {quizQuestions.length}
              </span>
              <div className="text-xs text-slate-400 mt-0.5">
                Topic: {quizQuestions[currentIdx].topic}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Answered: {Object.keys(userAnswers).length}/{quizQuestions.length}
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="text-base md:text-lg font-semibold text-slate-900 dark:text-white leading-snug">
            {quizQuestions[currentIdx].question}
          </div>

          {/* 4 Options */}
          <div className="space-y-2.5">
            {quizQuestions[currentIdx].options.map((opt, optIdx) => {
              const isSelected = userAnswers[quizQuestions[currentIdx].id] === optIdx;
              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full p-4 rounded-xl text-left text-sm font-medium transition-all flex items-center space-x-3 border ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:border-indigo-400'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="flex-1 leading-normal">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentIdx < quizQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((i) => Math.min(quizQuestions.length - 1, i + 1))}
                className="px-5 py-2 text-xs font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={handleFinishQuiz}
                className="px-6 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Submit Exam Quiz
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Quiz Results Report */
        quizResult && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Score Card */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-slate-800 dark:to-slate-850 border border-indigo-100 dark:border-slate-700/60">
              <div className="text-3xl md:text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
                {quizResult.scorePercentage}%
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                You scored {quizResult.correctCount} out of {quizResult.totalQuestions} correct!
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {quizResult.scorePercentage >= 80
                  ? '🌟 Outstanding! Excellent exam mastery on this topic.'
                  : quizResult.scorePercentage >= 60
                  ? '👍 Good progress! Review the explanations for incorrect questions below.'
                  : '⚠️ Needs revision. Check the identified weak topics below.'}
              </p>

              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={handleGenerateQuiz}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retake New Quiz
                </button>
              </div>
            </div>

            {/* Topic-Wise Breakdown */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Topic-Wise Performance
              </h4>
              <div className="space-y-2">
                {Object.entries(quizResult.topicScores).map(([topic, stat]) => (
                  <div
                    key={topic}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{topic}</div>
                      <div className="text-slate-500 text-[11px]">
                        {stat.correct}/{stat.total} questions correct
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`font-bold ${
                          stat.percentage >= 70
                            ? 'text-emerald-600'
                            : stat.percentage >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {stat.percentage}%
                      </span>
                      {stat.percentage < 70 && onNavigateToTutor && (
                        <button
                          onClick={() => onNavigateToTutor(topic)}
                          className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-medium text-[11px] hover:underline"
                        >
                          Revise with AI →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question by Question Review */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Detailed Answer & Explanations Review
              </h4>
              <div className="space-y-3">
                {quizResult.questions.map((q, idx) => {
                  const userChoice = quizResult.userAnswers[q.id];
                  const isCorrect = userChoice === q.correctAnswer;
                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        isCorrect
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Q{idx + 1}. {q.question}
                        </div>
                        {isCorrect ? (
                          <span className="shrink-0 flex items-center gap-1 text-emerald-600 font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Correct
                          </span>
                        ) : (
                          <span className="shrink-0 flex items-center gap-1 text-red-600 font-bold">
                            <XCircle className="w-4 h-4" /> Incorrect
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-slate-700 dark:text-slate-300">
                        <div>
                          <span className="text-slate-400">Your answer: </span>
                          <span className={isCorrect ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'}>
                            {userChoice !== undefined ? q.options[userChoice] : 'Not answered'}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div>
                            <span className="text-slate-400">Correct answer: </span>
                            <span className="text-emerald-700 font-semibold">
                              {q.options[q.correctAnswer]}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Explanation: </span>
                        {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
