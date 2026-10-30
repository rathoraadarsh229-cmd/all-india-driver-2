/**
 * Native Text-to-Speech (TTS) Utility - 100% Free (Zero API cost)
 * Uses browser's native window.speechSynthesis API
 * Supports Hindi (hi-IN) and English (en-IN) voices
 */

let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechListeners: Set<(isSpeaking: boolean) => void> = new Set();

export const subscribeSpeechState = (listener: (isSpeaking: boolean) => void) => {
  speechListeners.add(listener);
  return () => {
    speechListeners.delete(listener);
  };
};

const notifySpeechState = (isSpeaking: boolean) => {
  speechListeners.forEach((fn) => fn(isSpeaking));
};

export const speakText = (text: string, lang = 'hi-IN') => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Cancel any currently playing speech
  window.speechSynthesis.cancel();
  notifySpeechState(false);

  const cleanText = text.replace(/[*_#`]/g, '').trim();
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang;
  utterance.rate = 0.92; // slightly relaxed for clear comprehension
  utterance.pitch = 1.0;

  // Try to find a native Hindi or Indian English voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().includes('hi') ||
      v.name.toLowerCase().includes('hindi') ||
      v.lang.toLowerCase().includes('in')
  );

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onstart = () => {
    notifySpeechState(true);
  };

  utterance.onend = () => {
    notifySpeechState(false);
    activeUtterance = null;
  };

  utterance.onerror = () => {
    notifySpeechState(false);
    activeUtterance = null;
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    notifySpeechState(false);
    activeUtterance = null;
  }
};

export const isSpeakingCurrently = (): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking;
};
