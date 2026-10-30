import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { speakText, stopSpeech, subscribeSpeechState, isSpeakingCurrently } from '../utils/speech';

interface HearButtonProps {
  text: string;
  label?: string;
  lang?: string;
  className?: string;
  compact?: boolean;
}

export const HearButton: React.FC<HearButtonProps> = ({
  text,
  label = 'आवाज़ में सुनें (Hear)',
  lang = 'hi-IN',
  className = '',
  compact = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSpeechState((speaking) => {
      setIsPlaying(speaking);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      stopSpeech();
    } else {
      speakText(text, lang);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black cursor-pointer transition-all shadow-xs ${
          isPlaying
            ? 'bg-rose-500 text-white animate-pulse'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } ${className}`}
        title={isPlaying ? 'आवाज़ रोकें' : 'बोलकर सुनें'}
      >
        {isPlaying ? (
          <>
            <VolumeX className="h-3.5 w-3.5" />
            <span>रोकें</span>
          </>
        ) : (
          <>
            <Volume2 className="h-3.5 w-3.5" />
            <span>सुनें</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl font-black text-xs cursor-pointer transition-all shadow-md active:scale-95 ${
        isPlaying
          ? 'bg-rose-500 hover:bg-rose-600 text-white ring-2 ring-rose-300 animate-pulse'
          : 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-300/40'
      } ${className}`}
    >
      {isPlaying ? (
        <>
          <VolumeX className="h-4 w-4 shrink-0" />
          <span>आवाज़ रोकें (Stop)</span>
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4 shrink-0" />
          <span>{label}</span>
          <span className="flex items-center gap-0.5 ml-0.5">
            <span className="h-1.5 w-1 bg-white/70 rounded-full animate-bounce"></span>
            <span className="h-2.5 w-1 bg-white rounded-full animate-bounce delay-75"></span>
            <span className="h-1.5 w-1 bg-white/70 rounded-full animate-bounce delay-150"></span>
          </span>
        </>
      )}
    </button>
  );
};
