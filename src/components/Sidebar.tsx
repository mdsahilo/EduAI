import React from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Bot,
  CheckSquare,
  FileQuestion,
  CalendarCheck,
  TrendingUp,
  UserCircle,
  Sparkles,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type TabType =
  | 'dashboard'
  | 'documents'
  | 'tutor'
  | 'exam-answer'
  | 'quiz'
  | 'important-questions'
  | 'study-plan'
  | 'progress'
  | 'profile';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAuth: () => void;
  selectedDocName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onOpenAuth, selectedDocName }) => {
  const { user, logout } = useAuth();

  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'My Documents', icon: FolderOpen },
    { id: 'tutor', label: 'AI Tutor', icon: Bot },
    { id: 'exam-answer', label: 'Exam Answers', icon: CheckSquare },
    { id: 'quiz', label: 'Quiz & MCQs', icon: FileQuestion },
    { id: 'important-questions', label: 'Important Qs', icon: Sparkles },
    { id: 'study-plan', label: 'Study Planner', icon: CalendarCheck },
    { id: 'progress', label: 'Progress & Weak Topics', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen shrink-0 transition-all">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
              EduAI
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                Tutor
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Exam Prep Assistant</p>
          </div>
        </div>
      </div>

      {/* Active Document Indicator */}
      {selectedDocName && (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="overflow-hidden">
            <div className="text-[10px] uppercase font-semibold text-indigo-700 dark:text-indigo-300">Active Study PDF</div>
            <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" title={selectedDocName}>
              {selectedDocName}
            </div>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Study Portal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        {user ? (
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user.displayName}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.college || 'College Student'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <UserCircle className="w-4 h-4" />
            Sign In / Student Account
          </button>
        )}
      </div>
    </aside>
  );
};
