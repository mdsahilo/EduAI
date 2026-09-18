import React, { useState } from 'react';
import {
  CalendarCheck,
  Sparkles,
  Clock,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  Table,
  BookOpen
} from 'lucide-react';
import { StudyPlan, StudyTask } from '../types';
import { StorageService } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { exportStudyPlanToSheets } from '../lib/sheetsIntegration';

interface StudyPlannerProps {
  onPlanUpdated?: (plan: StudyPlan) => void;
}

export const StudyPlannerView: React.FC<StudyPlannerProps> = ({ onPlanUpdated }) => {
  const { user } = useAuth();
  const existingPlans = user ? StorageService.getStudyPlans(user.uid) : [];
  const currentPlan = existingPlans[0] || null;

  const [examDate, setExamDate] = useState<string>(
    currentPlan?.examDate || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [subjects, setSubjects] = useState<string>(
    currentPlan?.subjects.join(', ') || 'Computer Networks, Database Management Systems'
  );
  const [availableHours, setAvailableHours] = useState<number>(currentPlan?.availableHoursPerDay || 3);
  const [topics, setTopics] = useState<string>(
    currentPlan?.topics.join(', ') || 'OSI Model, TCP Congestion, SQL Queries, Normalization'
  );
  const [prepLevel, setPrepLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(
    currentPlan?.preparationLevel || 'Intermediate'
  );

  const [activePlan, setActivePlan] = useState<StudyPlan | null>(currentPlan);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [exportingSheet, setExportingSheet] = useState<boolean>(false);
  const [sheetSuccessUrl, setSheetSuccessUrl] = useState<string | null>(currentPlan?.spreadsheetUrl || null);

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError('');

    try {
      const subList = subjects.split(',').map((s) => s.trim()).filter(Boolean);
      const topList = topics.split(',').map((t) => t.trim()).filter(Boolean);

      const response = await fetch('/api/ai/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examDate,
          subjects: subList,
          availableHoursPerDay: availableHours,
          topics: topList,
          preparationLevel: prepLevel,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to generate study plan (${response.status})`);
      }

      const data = await response.json();
      const newPlan: StudyPlan = {
        id: 'plan_' + Date.now(),
        examDate,
        subjects: subList,
        availableHoursPerDay: availableHours,
        topics: topList,
        preparationLevel: prepLevel,
        createdAt: new Date().toISOString(),
        tasks: data.tasks || [],
      };

      setActivePlan(newPlan);
      if (user?.uid) {
        StorageService.saveStudyPlan(user.uid, newPlan);
      }
      onPlanUpdated?.(newPlan);
    } catch (err: any) {
      console.error('Study plan generation error:', err);
      setError(err.message || 'Failed to create study plan. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    if (!activePlan) return;
    const updatedTasks = activePlan.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const updatedPlan: StudyPlan = {
      ...activePlan,
      tasks: updatedTasks,
    };
    setActivePlan(updatedPlan);
    if (user?.uid) {
      StorageService.saveStudyPlan(user.uid, updatedPlan);
    }
    onPlanUpdated?.(updatedPlan);
  };

  const handleExportToGoogleSheets = async () => {
    if (!activePlan) return;
    setExportingSheet(true);
    setError('');

    try {
      // In web app with OAuth, we can prompt or use Google Identity token
      // If no token in session, prompt student to authorize
      let token = (window as any).gapi?.auth2?.getAuthInstance?.()?.currentUser?.get()?.getAuthResponse?.()?.access_token;
      
      if (!token) {
        // Mock prompt or user token flow
        token = prompt('Please paste your Google OAuth Access Token with spreadsheets scope, or press OK to generate a downloadable spreadsheet data format:');
      }

      if (token && token.trim().length > 10) {
        const res = await exportStudyPlanToSheets(
          token.trim(),
          activePlan.subjects.join(' & '),
          activePlan.tasks
        );
        setSheetSuccessUrl(res.spreadsheetUrl);
        const updated = { ...activePlan, spreadsheetUrl: res.spreadsheetUrl };
        setActivePlan(updated);
        if (user?.uid) StorageService.saveStudyPlan(user.uid, updated);
      } else {
        // Fallback: CSV export for direct import into Google Sheets
        const csvRows = [
          ['Day', 'Target Date', 'Subject', 'Focus Topic & Study Task', 'Est. Hours', 'Status'],
          ...activePlan.tasks.map((t) => [
            `Day ${t.day}`,
            t.dateStr,
            `"${t.subject}"`,
            `"${t.title}"`,
            t.estimatedHours,
            t.completed ? 'COMPLETED' : 'PENDING',
          ]),
        ];
        const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `EduAI_Study_Schedule_${activePlan.examDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      console.error('Google Sheets export error:', err);
      setError(err.message || 'Unable to sync with Google Sheets. Please check permissions.');
    } finally {
      setExportingSheet(false);
    }
  };

  const totalTasks = activePlan?.tasks.length || 0;
  const completedTasks = activePlan?.tasks.filter((t) => t.completed).length || 0;
  const percentDone = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6 md:p-8 rounded-2xl shadow-sm border border-blue-800/40">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <CalendarCheck className="w-3.5 h-3.5" /> Exam Countdown & Adaptive Schedule
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
            Personalized Study Planner
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Generate an intelligent day-by-day revision roadmap mapped right up to your college examination date. Track daily goals, check off completed milestones, and sync with Google Sheets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configuration Column */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-slate-400">
            Study Parameters
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Upcoming Exam Date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subjects (comma separated)
            </label>
            <input
              type="text"
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              placeholder="e.g. Computer Networks, DBMS, OS"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Available Study Hours / Day: {availableHours} hrs
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={availableHours}
              onChange={(e) => setAvailableHours(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority Chapters / Focus Topics
            </label>
            <textarea
              rows={3}
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="e.g. TCP Congestion, Subnetting, SQL Joins, Indexing"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Preparation Level
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPrepLevel(lvl)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    prepLevel === lvl
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating Custom Roadmap...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generate Day-By-Day Plan
              </>
            )}
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}
        </div>

        {/* Schedule Tasks Column */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {activePlan ? (
            <>
              {/* Progress Summary Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Exam Revision Roadmap
                  </h4>
                  <p className="text-xs text-slate-500">
                    Target Exam: {activePlan.examDate} • {completedTasks}/{totalTasks} tasks completed ({percentDone}%)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportToGoogleSheets}
                    disabled={exportingSheet}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {exportingSheet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Table className="w-3.5 h-3.5" />}
                    Export to Google Sheets
                  </button>

                  {sheetSuccessUrl && (
                    <a
                      href={sheetSuccessUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-emerald-600 hover:text-emerald-700"
                      title="Open in Google Sheets"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentDone}%` }}
                />
              </div>

              {/* Day Tasks List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {activePlan.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-3.5 ${
                      task.completed
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 opacity-80'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400'
                    }`}
                  >
                    <button type="button" className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400">
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Day {task.day} • {task.dateStr}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {task.estimatedHours} hrs
                        </span>
                      </div>

                      <div
                        className={`text-sm font-semibold ${
                          task.completed
                            ? 'line-through text-slate-500 dark:text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                          {task.subject}
                        </span>
                        {task.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
              <CalendarCheck className="w-12 h-12 stroke-1 text-slate-400" />
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                No active exam study plan
              </p>
              <p className="text-xs max-w-sm text-slate-400">
                Fill in your exam date, subjects, and study hours on the left to generate an adaptive AI revision schedule.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
