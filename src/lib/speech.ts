// Speech synthesis wrapper for Text-To-Speech with Play, Pause, Resume, Stop
export class SpeechService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static isSpeakingCallback: ((state: 'playing' | 'paused' | 'stopped') => void) | null = null;

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static speak(text: string, onStateChange?: (state: 'playing' | 'paused' | 'stopped') => void) {
    if (!this.synth) return;

    this.stop();
    this.isSpeakingCallback = onStateChange || null;

    // Clean markdown symbols to make speech fluid
    const cleanText = text
      .replace(/[*#_`>]/g, '')
      .replace(/\[Source:[^\]]+\]/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeakingCallback?.('playing');
    };

    utterance.onend = () => {
      this.isSpeakingCallback?.('stopped');
      this.currentUtterance = null;
    };

    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      this.isSpeakingCallback?.('stopped');
      this.currentUtterance = null;
    };

    utterance.onpause = () => {
      this.isSpeakingCallback?.('paused');
    };

    utterance.onresume = () => {
      this.isSpeakingCallback?.('playing');
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public static pause() {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.isSpeakingCallback?.('paused');
    }
  }

  public static resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.isSpeakingCallback?.('playing');
    }
  }

  public static stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeakingCallback?.('stopped');
      this.currentUtterance = null;
    }
  }
}
