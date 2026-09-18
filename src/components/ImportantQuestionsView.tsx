import React, { useState } from 'react';
import { Sparkles, BookOpen, AlertCircle, Bookmark, CheckCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { DocumentItem, ImportantQuestionItem } from '../types';

interface ImportantQuestionsProps {
  documents: DocumentItem[];
  activeDocument: DocumentItem | null;
  onSelectForAnswer?: (q: string) => void;
}

export const ImportantQuestionsView: React.FC<ImportantQuestionsProps> = ({
  documents,
  activeDocument,
  onSelectForAnswer,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(activeDocument?.id || (documents[0]?.id || ''));
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<ImportantQuestionItem[]>([]);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Very Important' | 'Important' | 'Revision'>('All');

  const currentDoc = documents.find((d) => d.id === selectedDocId) || activeDocument;

  const handleGenerate = async () => {
    if (!currentDoc) {
      setError('Please upload or select a document first.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/important-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: currentDoc.extractedText,
          docName: currentDoc.name,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned status ${response.status}`);
      }

      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err: any) {
      console.error('Important questions error:', err);
      setError(err.message || 'Failed to extract important questions. Check network or Gemini API key.');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions =
    activeFilter === 'All' ? questions : questions.filter((q) => q.priority === activeFilter);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-900 to-indigo-900 text-white p-6 md:p-8 rounded-2xl shadow-sm border border-violet-800/40">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold mb-3 border border-violet-400/30">
            <Sparkles className="w-3.5 h-3.5" /> High-Probability Question Forecaster
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
            Important Examination Questions
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            EduAI analyzes the conceptual density of your notes and extracts key examination topics categorized by study priority (Very Important, Important, and Revision).
          </p>
          <div className="mt-3 text-[11px] text-amber-300/90 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Disclaimer: These are AI-generated study priorities based on your document's syllabus scope, not a leak of actual exam papers.
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                📄 {doc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analyzing Document Priorities...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Extract Important Questions
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      {/* Filter Tabs if questions exist */}
      {questions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['All', 'Very Important', 'Important', 'Revision'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeFilter === filter
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              {filter} (
              {filter === 'All' ? questions.length : questions.filter((q) => q.priority === filter).length}
              )
            </button>
          ))}
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Exam algorithm scanning lecture notes...
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Evaluating core definitions, repeated theorems, architectures, and standard semester question structures.
            </p>
          </div>
        ) : filteredQuestions.length > 0 ? (
          filteredQuestions.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5 transition-all hover:border-indigo-300 dark:hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          item.priority === 'Very Important'
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                            : item.priority === 'Important'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.marksRecommendation}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Topic: <span className="text-slate-600 dark:text-slate-300 font-medium">{item.topic}</span>
                      </span>
                    </div>

                    <h4 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white pt-1">
                      {item.question}
                    </h4>
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-white">Why this is critical: </span>
                      {item.reason}
                    </div>

                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block mb-1.5">
                        Key Points to include in Exam Answer:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
                        {item.sampleKeyPoints.map((pt, pIdx) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    {onSelectForAnswer && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => onSelectForAnswer(item.question)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold text-xs hover:underline flex items-center gap-1.5"
                        >
                          Generate Complete Exam Paper Answer →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-3">
            <Bookmark className="w-10 h-10 stroke-1 mx-auto" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No important questions extracted yet
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Select your uploaded study material above and click "Extract Important Questions" to let EduAI analyze examination priorities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
