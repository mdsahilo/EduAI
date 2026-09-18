import React, { useState } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { SpeechService } from '../lib/speech';

interface TtsPlayerProps {
  text: string;
  className?: string;
}

export const TtsPlayer: React.FC<TtsPlayerProps> = ({ text, className = '' }) => {
  const [speechState, setSpeechState] = useState<'playing' | 'paused' | 'stopped'>('stopped');

  const handlePlay = () => {
    if (speechState === 'paused') {
      SpeechService.resume();
      setSpeechState('playing');
    } else {
      SpeechService.speak(text, (state) => {
        setSpeechState(state);
      });
    }
  };

  const handlePause = () => {
    SpeechService.pause();
    setSpeechState('paused');
  };

  const handleStop = () => {
    SpeechService.stop();
    setSpeechState('stopped');
  };

  if (!SpeechService.isSupported()) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 ${className}`}>
      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 pr-1 border-r border-slate-200 dark:border-slate-700">
        <Volume2 className={`w-3.5 h-3.5 ${speechState === 'playing' ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : 'text-slate-400'}`} />
        Listen
      </span>

      {speechState !== 'playing' ? (
        <button
          onClick={handlePlay}
          title="Play aloud"
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
        >
          <Play className="w-3 h-3 fill-current" />
        </button>
      ) : (
        <button
          onClick={handlePause}
          title="Pause speech"
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-600 transition-colors"
        >
          <Pause className="w-3 h-3 fill-current" />
        </button>
      )}

      {speechState !== 'stopped' && (
        <button
          onClick={handleStop}
          title="Stop reading"
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-red-600 transition-colors"
        >
          <Square className="w-3 h-3 fill-current" />
        </button>
      )}
    </div>
  );
};
