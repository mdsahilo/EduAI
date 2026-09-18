import React, { useState, useMemo } from 'react';
import {
  FileText,
  Trash2,
  BookOpen,
  Calendar,
  Sparkles,
  Bot,
  FileQuestion,
  CheckSquare,
  Search,
  X,
  FileSearch
} from 'lucide-react';
import { DocumentItem } from '../types';
import { PdfUploader } from './PdfUploader';

interface DocumentLibraryProps {
  documents: DocumentItem[];
  activeDocument: DocumentItem | null;
  onSelectDoc: (doc: DocumentItem) => void;
  onDeleteDoc: (docId: string) => void;
  onUploadSuccess: (doc: DocumentItem) => void;
  onOpenTutor: (doc: DocumentItem) => void;
  onGenerateQuiz: (doc: DocumentItem) => void;
  onGenerateExamAnswer: (doc: DocumentItem) => void;
}

export const DocumentLibraryView: React.FC<DocumentLibraryProps> = ({
  documents,
  activeDocument,
  onSelectDoc,
  onDeleteDoc,
  onUploadSuccess,
  onOpenTutor,
  onGenerateQuiz,
  onGenerateExamAnswer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter documents by filename, extracted content, summary, or topics
  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return documents;

    return documents.filter((doc) => {
      const nameMatch = doc.name.toLowerCase().includes(query);
      const summaryMatch = doc.summary ? doc.summary.toLowerCase().includes(query) : false;
      const topicMatch = doc.topics?.some((t) => t.toLowerCase().includes(query)) || false;
      const contentMatch = doc.extractedText ? doc.extractedText.toLowerCase().includes(query) : false;

      return nameMatch || summaryMatch || topicMatch || contentMatch;
    });
  }, [documents, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Upload College Notes & PDFs
        </h3>
        <PdfUploader onDocumentProcessed={onUploadSuccess} />
      </div>

      {/* Documents List & Search Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Study Materials Library
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
              {documents.length}
            </span>
          </div>

          {/* Search Bar */}
          {documents.length > 0 && (
            <div className="relative w-full sm:w-80">
              <label htmlFor="document-library-search-input" className="sr-only">
                Search study materials
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="document-library-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search filename or content keywords..."
                className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Clear search"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter feedback status if searching */}
        {searchQuery.trim() && documents.length > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Showing {filteredDocuments.length} of {documents.length} document{documents.length === 1 ? '' : 's'} matching &ldquo;{searchQuery}&rdquo;
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Reset filter
            </button>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-2">
            <FileText className="w-12 h-12 stroke-1 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No documents in your library
            </p>
            <p className="text-xs text-slate-400">
              Upload a syllabus PDF or lecture notes file above to begin studying with EduAI.
            </p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-400 space-y-3">
            <FileSearch className="w-12 h-12 stroke-1 mx-auto text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No matching study materials found
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No PDFs matched your search for &ldquo;{searchQuery}&rdquo; in filenames or lecture notes text.
              </p>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              Clear Search Query
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocuments.map((doc) => {
              const isActive = activeDocument?.id === doc.id;
              const query = searchQuery.trim().toLowerCase();
              const matchedInContentOnly =
                query &&
                !doc.name.toLowerCase().includes(query) &&
                doc.extractedText?.toLowerCase().includes(query);

              return (
                <div
                  key={doc.id}
                  className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    isActive
                      ? 'border-indigo-600 ring-2 ring-indigo-600/10 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={doc.name}>
                            {doc.name}
                          </h4>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>{doc.pageCount} Pages</span>
                            <span>•</span>
                            <span>{(doc.size / 1024).toFixed(0)} KB</span>
                            <span>•</span>
                            <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {documents.length > 1 && (
                        <button
                          onClick={() => onDeleteDoc(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Matched in content badge */}
                    {matchedInContentOnly && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium border border-indigo-200 dark:border-indigo-800">
                        <Search className="w-3 h-3" />
                        <span>Keyword matched in document content</span>
                      </div>
                    )}

                    {/* Summary */}
                    {doc.summary && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        {doc.summary}
                      </p>
                    )}

                    {/* Topics badges */}
                    {doc.topics && doc.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {doc.topics.slice(0, 4).map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectDoc(doc)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {isActive ? '✓ Currently Active' : 'Set as Active'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelectDoc(doc);
                          onOpenTutor(doc);
                        }}
                        title="Open in AI Tutor"
                        className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                      >
                        <Bot className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          onSelectDoc(doc);
                          onGenerateExamAnswer(doc);
                        }}
                        title="Generate Exam Answers"
                        className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          onSelectDoc(doc);
                          onGenerateQuiz(doc);
                        }}
                        title="Generate Quiz"
                        className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                      >
                        <FileQuestion className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
