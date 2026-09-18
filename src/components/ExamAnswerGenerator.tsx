import React, { useState } from 'react';
import { CheckSquare, Sparkles, BookOpen, Copy, Check, Loader2, Award, FileText } from 'lucide-react';
import { DocumentItem } from '../types';
import { TtsPlayer } from './TtsPlayer';

interface ExamAnswerProps {
  documents: DocumentItem[];
  activeDocument: DocumentItem | null;
  initialQuestion?: string;
}

export const ExamAnswerGenerator: React.FC<ExamAnswerProps> = ({
  documents,
  activeDocument,
  initialQuestion = '',
}) => {
  const [question, setQuestion] = useState(initialQuestion || 'Explain TCP congestion control and differentiate it from flow control.');
  const [selectedMarks, setSelectedMarks] = useState<'2' | '5' | '10'>('5');
  const [selectedDocId, setSelectedDocId] = useState<string>(activeDocument?.id || (documents[0]?.id || ''));
  const [loading, setLoading] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const currentDoc = documents.find((d) => d.id === selectedDocId) || activeDocument;

  const handleGenerate = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError('');
    setGeneratedAnswer('');

    try {
      const response = await fetch('/api/ai/exam-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          marks: selectedMarks,
          documentText: currentDoc?.extractedText || '',
          docName: currentDoc?.name || '',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error ${response.status}`);
      }

      const data = await response.json();
      setGeneratedAnswer(data.answer);
    } catch (err: any) {
      console.error('Failed to generate exam answer:', err);
      setError(err.message || 'Failed to generate exam answer. Check connection or API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedAnswer) return;
    navigator.clipboard.writeText(generatedAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-sm border border-indigo-800/40">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/30">
            <Award className="w-3.5 h-3.5" /> University Exam Scoring Engine
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
            Exam Answer Generator
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Format high-scoring, structured answers strictly calibrated for 2-mark, 5-mark, or 10-mark college university question papers with formal headings, diagrams, and bullet points.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls Column */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Exam Configuration
          </h3>

          {/* Marks Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Question Marks Weightage
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['2', '5', '10'] as const).map((marks) => (
                <button
                  key={marks}
                  type="button"
                  onClick={() => setSelectedMarks(marks)}
                  className={`py-3 px-2 rounded-xl text-center font-semibold transition-all border ${
                    selectedMarks === marks
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  <div className="text-base">{marks} Marks</div>
                  <div className="text-[10px] font-normal opacity-80">
                    {marks === '2' ? 'Definition / 2 Pts' : marks === '5' ? 'Short Essay' : 'Full University Essay'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reference Document */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Source Document (Optional)</span>
              {currentDoc && <span className="text-[10px] text-emerald-600 font-normal">Active</span>}
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Standard Academic Curriculum (No doc)</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    📄 {doc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exam Question */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Enter University Examination Question
            </label>
            <textarea
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Explain TCP Congestion Control and explain Slow Start vs Congestion Avoidance with diagrams."
              className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Presets */}
          <div>
            <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1.5">
              Quick Question Examples:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Explain OSI 7-Layer Architecture',
                'What is TCP Congestion Control?',
                'Differentiate between Flow Control and Congestion Control',
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuestion(preset)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !question.trim()}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Formatting {selectedMarks}-Mark College Answer...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate {selectedMarks}-Mark Exam Answer
              </>
            )}
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}
        </div>

        {/* Generated Answer Display Column */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[450px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  University Exam Format Output
                </h4>
                <p className="text-[11px] text-slate-500">
                  Targeted for {selectedMarks} Marks • Examiner-ready layout
                </p>
              </div>
            </div>

            {generatedAnswer && (
              <div className="flex items-center space-x-2">
                <TtsPlayer text={generatedAnswer} />
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Synthesizing university exam points...
                </div>
                <p className="text-xs text-slate-500 max-w-sm">
                  Structuring definitions, diagrams descriptions, and scoring criteria according to university marks breakdown.
                </p>
              </div>
            ) : generatedAnswer ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed space-y-3 font-normal">
                {generatedAnswer}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                <CheckSquare className="w-10 h-10 stroke-1" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No answer generated yet
                </p>
                <p className="text-xs max-w-xs text-slate-400">
                  Enter your question and pick a mark weightage (2, 5, or 10 marks) on the left, then click Generate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
