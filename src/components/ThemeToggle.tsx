import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = false, className = '' }) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      id="global-theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700/90 text-amber-300 border border-slate-700 shadow-inner'
          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 shadow-sm'
      } ${className}`}
      title={
        isDark
          ? 'Switch to Light Mode (Daytime Study)'
          : 'Switch to Dark Mode (Late-Night Study Session)'
      }
      aria-label={
        isDark
          ? 'Switch to Light Mode (Daytime Study)'
          : 'Switch to Dark Mode (Late-Night Study Session)'
      }
    >
      <span className="relative flex items-center justify-center w-4 h-4">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 rotate-0 scale-100" />
        )}
      </span>

      <span className="hidden sm:inline-block">
        {isDark ? (
          <span className="flex items-center gap-1 text-slate-200 font-medium">
            <span className="text-amber-400 font-bold">Dark</span>
            <span className="text-[10px] text-slate-400 font-normal">(Late-Night)</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-slate-700 font-medium">
            <span className="text-indigo-600 font-bold">Light</span>
            <span className="text-[10px] text-slate-500 font-normal">(Day Study)</span>
          </span>
        )}
      </span>
    </button>
  );
};
