import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { extractTextFromPdf, MAX_PDF_SIZE_BYTES } from '../lib/pdfExtractor';
import { DocumentItem } from '../types';

interface PdfUploaderProps {
  onDocumentProcessed: (doc: DocumentItem) => void;
  isProcessing?: boolean;
}

export type ProcessingState =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'extracting'
  | 'ready'
  | 'error';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const PdfUploader: React.FC<PdfUploaderProps> = ({ onDocumentProcessed }) => {
  const [dragActive, setDragActive] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [detailText, setDetailText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<DocumentItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusLabel = (state: ProcessingState): string => {
    switch (state) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing PDF...';
      case 'extracting':
        return 'Extracting study content...';
      case 'ready':
        return 'Ready to study ✓';
      case 'error':
        return 'Upload Failed';
      default:
        return 'Upload College Study Material / PDF';
    }
  };

  const resetUploader = () => {
    setProcessingState('idle');
    setProgress(0);
    setDetailText('');
    setError('');
    setSelectedFile(null);
    setUploadedDoc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = async (file: File) => {
    setError('');
    if (!file) return;

    setSelectedFile({ name: file.name, size: file.size });

    // File type validation
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setProcessingState('error');
      setError('Please upload a valid PDF file (.pdf extension).');
      return;
    }

    // 50MB file size validation
    if (file.size > MAX_PDF_SIZE_BYTES) {
      setProcessingState('error');
      setError('File is too large. Please upload a PDF smaller than 50MB.');
      return;
    }

    try {
      // State 1: Uploading...
      setProcessingState('uploading');
      setProgress(15);
      setDetailText('Reading document bytes...');
      // Yield to let UI update
      await new Promise((resolve) => setTimeout(resolve, 200));

      // State 2: Processing PDF...
      setProcessingState('processing');
      setProgress(30);
      setDetailText('Parsing document catalog and page structure...');
      await new Promise((resolve) => setTimeout(resolve, 150));

      // State 3: Extracting study content...
      setProcessingState('extracting');
      setProgress(45);
      setDetailText('Extracting readable text & key pages from PDF...');

      const extracted = await extractTextFromPdf(file, (info) => {
        // Map 0..100% extraction into 45%..85% of overall progress
        const mappedPercent = 45 + Math.round((info.percent / 100) * 40);
        setProgress(mappedPercent);
        if (info.currentPage && info.totalPages) {
          setDetailText(`Extracting page ${info.currentPage} of ${info.totalPages}...`);
        }
      });

      // AI Analysis stage
      setProgress(90);
      setDetailText('Analyzing key syllabus topics & summary with EduAI...');

      let summary = '';
      let topics: string[] = [];
      try {
        const res = await fetch('/api/ai/process-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentText: extracted.text.slice(0, 40000),
            docName: file.name,
            fileSize: file.size,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          summary = data.summary || '';
          topics = data.topics || [];
        }
      } catch (err) {
        console.warn('AI document analysis failed or key missing, proceeding with extracted text:', err);
      }

      const newDoc: DocumentItem = {
        id: 'doc_' + Date.now(),
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        pageCount: extracted.pageCount,
        extractedText: extracted.text,
        summary:
          summary ||
          `Document extracted with ${extracted.pageCount} pages and ${extracted.text.split(' ').length} words.`,
        topics: topics.length > 0 ? topics : ['General Syllabus', 'Unit Concepts'],
      };

      // Save document and set as Active Study PDF in application state
      onDocumentProcessed(newDoc);
      setUploadedDoc(newDoc);

      // State 4: Ready to study ✓
      setProgress(100);
      setProcessingState('ready');
      setDetailText('Document successfully indexed and set as your Active Study PDF.');
    } catch (err: any) {
      console.error('Error processing PDF:', err);
      setProcessingState('error');
      setError(
        err.message ||
          'Failed to extract text from PDF. The file may be password protected, corrupted, or composed purely of scanned images.'
      );
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const isBusy =
    processingState === 'uploading' ||
    processingState === 'processing' ||
    processingState === 'extracting';

  return (
    <div className="w-full space-y-4">
      {/* Dropzone Container */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isBusy && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 md:p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
            : isBusy
            ? 'border-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/10 cursor-wait'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleChange}
          disabled={isBusy}
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-sm border transition-colors ${
              processingState === 'ready'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : processingState === 'error'
                ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                : isBusy
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50'
            }`}
          >
            {isBusy ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : processingState === 'ready' ? (
              <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            ) : processingState === 'error' ? (
              <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            {getStatusLabel(processingState)}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 max-w-sm">
            {isBusy
              ? detailText || 'Processing your study materials...'
              : processingState === 'ready'
              ? 'Document indexed successfully and active for tutoring, quizzes & exams.'
              : 'Drag & drop lecture notes, textbooks, or syllabus PDFs (up to 50MB)'}
          </p>

          {!isBusy && processingState !== 'ready' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition-all shadow-sm">
              <FileText className="w-3.5 h-3.5" />
              Browse PDF File
            </span>
          )}

          {processingState === 'ready' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetUploader();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Upload Another PDF
            </button>
          )}
        </div>
      </div>

      {/* Selected File Details, Progress & Status Card */}
      {selectedFile && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-xs font-bold text-slate-900 dark:text-white truncate"
                  title={selectedFile.name}
                >
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Size: {formatFileSize(selectedFile.size)}</span>
                  {uploadedDoc && <span>• {uploadedDoc.pageCount} Pages</span>}
                </div>
              </div>
            </div>

            {/* Processing Status Badge */}
            <div className="shrink-0">
              {processingState === 'uploading' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Uploading...
                </span>
              )}
              {processingState === 'processing' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing PDF...
                </span>
              )}
              {processingState === 'extracting' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Extracting study content...
                </span>
              )}
              {processingState === 'ready' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-3 h-3" />
                  Ready to study ✓
                </span>
              )}
              {processingState === 'error' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-semibold border border-red-200 dark:border-red-800">
                  <AlertTriangle className="w-3 h-3" />
                  Failed
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar (visible during processing or on ready) */}
          {(isBusy || processingState === 'ready') && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span>{detailText || getStatusLabel(processingState)}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {progress}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    processingState === 'ready'
                      ? 'bg-emerald-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Banner with Explanations */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{error}</p>
            {error.includes('scanned') && (
              <p className="text-[11px] text-red-600/90 dark:text-red-400/90">
                Tip: If your document was scanned from a physical textbook or phone camera, try using a PDF with searchable digital text or OCR.
              </p>
            )}
            {error.includes('50MB') && (
              <p className="text-[11px] text-red-600/90 dark:text-red-400/90">
                Tip: You can split larger textbooks into individual chapter or unit PDFs (each up to 50MB) for faster processing and targeted revision.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success Banner */}
      {processingState === 'ready' && uploadedDoc && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              Ready to study ✓ — &ldquo;{uploadedDoc.name}&rdquo; is now your Active Study PDF
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
              Extracted {uploadedDoc.pageCount} pages. You can now practice AI exam answers, generate MCQs, or ask the AI Tutor questions grounded in this document.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
