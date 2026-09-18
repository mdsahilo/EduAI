import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardHome } from './components/DashboardHome';
import { DocumentLibraryView } from './components/DocumentLibraryView';
import { AiTutor } from './components/AiTutor';
import { ExamAnswerGenerator } from './components/ExamAnswerGenerator';
import { McqQuizGenerator } from './components/McqQuizGenerator';
import { ImportantQuestionsView } from './components/ImportantQuestionsView';
import { StudyPlannerView } from './components/StudyPlannerView';
import { ProgressDashboardView } from './components/ProgressDashboardView';
import { UserProfileView } from './components/UserProfileView';
import { AuthModal } from './components/AuthModal';
import { DocumentItem, QuizResult, StudyPlan, WeakTopicAnalysis } from './types';
import { StorageService } from './lib/storage';
import { Menu, X, Sparkles, GraduationCap, Bell } from 'lucide-react';

function EduAiApp() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Core Data States
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null);
  const [quizzes, setQuizzes] = useState<QuizResult[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopicAnalysis[]>([]);

  // Jump helpers between features
  const [examAnswerQuestion, setExamAnswerQuestion] = useState<string>('');

  // Load user data on change of user session
  useEffect(() => {
    if (user?.uid) {
      const userDocs = StorageService.getDocuments(user.uid);
      setDocuments(userDocs);
      setActiveDocument(userDocs[0] || null);

      const userQuizzes = StorageService.getQuizzes(user.uid);
      setQuizzes(userQuizzes);

      const userPlans = StorageService.getStudyPlans(user.uid);
      setStudyPlans(userPlans);

      const computedWeak = StorageService.computeWeakTopics(user.uid);
      setWeakTopics(computedWeak);
    }
  }, [user?.uid]);

  const handleDocumentUploaded = (doc: DocumentItem) => {
    if (!user?.uid) return;
    StorageService.saveDocument(user.uid, doc);
    setDocuments((prev) => [doc, ...prev]);
    setActiveDocument(doc);
  };

  const handleDeleteDocument = (docId: string) => {
    if (!user?.uid) return;
    StorageService.deleteDocument(user.uid, docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (activeDocument?.id === docId) {
      const remaining = documents.filter((d) => d.id !== docId);
      setActiveDocument(remaining[0] || null);
    }
  };

  const handleQuizFinished = (result: QuizResult) => {
    if (!user?.uid) return;
    setQuizzes((prev) => [result, ...prev]);
    const refreshedWeak = StorageService.computeWeakTopics(user.uid);
    setWeakTopics(refreshedWeak);
  };

  const handlePlanUpdated = (plan: StudyPlan) => {
    setStudyPlans((prev) => [plan, ...prev.filter((p) => p.id !== plan.id)]);
  };

  const handleJumpToExamAnswer = (question: string) => {
    setExamAnswerQuestion(question);
    setCurrentTab('exam-answer');
  };

  const handleReviseTopicInTutor = (topic: string) => {
    setCurrentTab('tutor');
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          selectedDocName={activeDocument?.name}
        />
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-full">
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setMobileMenuOpen(false);
              }}
              onOpenAuth={() => {
                setIsAuthModalOpen(true);
                setMobileMenuOpen(false);
              }}
              selectedDocName={activeDocument?.name}
            />
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 px-4 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl md:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-800 dark:text-white capitalize">
                {currentTab.replace('-', ' ')}
              </span>
              {activeDocument && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  Active: {activeDocument.name.slice(0, 22)}...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Global Theme Toggle for late-night study sessions */}
            <ThemeToggle />

            <button
              onClick={() => setCurrentTab('tutor')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Tutor</span>
            </button>

            <button
              onClick={() => setCurrentTab('profile')}
              className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center hover:ring-2 hover:ring-indigo-400 transition-all shadow-sm"
              title="Student Profile"
            >
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </button>
          </div>
        </header>

        {/* Scrollable Main Content Frame */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardHome
                documents={documents}
                activeDocument={activeDocument}
                quizzes={quizzes}
                weakTopics={weakTopics}
                studyPlan={studyPlans[0] || null}
                onNavigate={(t) => setCurrentTab(t)}
                onSelectDoc={(d) => setActiveDocument(d)}
                onTriggerUpload={() => setCurrentTab('documents')}
                onReviseTopic={handleReviseTopicInTutor}
              />
            )}

            {currentTab === 'documents' && (
              <DocumentLibraryView
                documents={documents}
                activeDocument={activeDocument}
                onSelectDoc={(d) => setActiveDocument(d)}
                onDeleteDoc={handleDeleteDocument}
                onUploadSuccess={handleDocumentUploaded}
                onOpenTutor={() => setCurrentTab('tutor')}
                onGenerateQuiz={() => setCurrentTab('quiz')}
                onGenerateExamAnswer={() => setCurrentTab('exam-answer')}
              />
            )}

            {currentTab === 'tutor' && (
              <AiTutor
                documents={documents}
                activeDocument={activeDocument}
                onSelectDoc={(d) => setActiveDocument(d)}
                onJumpToExamAnswer={handleJumpToExamAnswer}
              />
            )}

            {currentTab === 'exam-answer' && (
              <ExamAnswerGenerator
                documents={documents}
                activeDocument={activeDocument}
                initialQuestion={examAnswerQuestion}
              />
            )}

            {currentTab === 'quiz' && (
              <McqQuizGenerator
                documents={documents}
                activeDocument={activeDocument}
                onQuizFinished={handleQuizFinished}
                onNavigateToTutor={handleReviseTopicInTutor}
              />
            )}

            {currentTab === 'important-questions' && (
              <ImportantQuestionsView
                documents={documents}
                activeDocument={activeDocument}
                onSelectForAnswer={handleJumpToExamAnswer}
              />
            )}

            {currentTab === 'study-plan' && (
              <StudyPlannerView onPlanUpdated={handlePlanUpdated} />
            )}

            {currentTab === 'progress' && (
              <ProgressDashboardView
                quizzes={quizzes}
                weakTopics={weakTopics}
                studyPlan={studyPlans[0] || null}
                documents={documents}
                onReviseTopic={handleReviseTopicInTutor}
                onTakeQuizForTopic={(topic) => {
                  setCurrentTab('quiz');
                }}
              />
            )}

            {currentTab === 'profile' && <UserProfileView />}
          </div>
        </main>
      </div>

      {/* Auth Modal for Student Sign-in / Registration */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EduAiApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
