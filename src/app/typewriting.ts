
export interface TypewriterOptions {

    phrases: string[];

    render: (text: string) => void;
    canRun?: () => boolean;
    typeMs?: number;   
    eraseMs?: number;  
    holdMs?: number;  
    pauseMs?: number;  
  }
  
  export const prefersReducedMotion = (): boolean =>
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  export class Typewriter {
    private timer: ReturnType<typeof setTimeout> | null = null;
    private running = false;
    private phraseIndex = 0;
    private length = 0;
    private erasing = false;
  
    constructor(private readonly o: TypewriterOptions) {}
  
    start(): void {
      if (this.running || !this.o.phrases.length) return;
      this.running = true;
      this.tick();
    }
  
    stop(): void {
      this.running = false;
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
    }
  
    reset(): void {
      this.stop();
      this.phraseIndex = 0;
      this.length = 0;
      this.erasing = false;
    }
  
    private tick(): void {
      if (!this.running) return;
  
      if (this.o.canRun && !this.o.canRun()) {
        this.timer = setTimeout(() => this.tick(), 300);
        return;
      }
  
      const { phrases, render } = this.o;
      const typeMs = this.o.typeMs ?? 70;
      const eraseMs = this.o.eraseMs ?? 32;
      const holdMs = this.o.holdMs ?? 1800;
      const pauseMs = this.o.pauseMs ?? 450;
      const phrase = phrases[this.phraseIndex];
      let delay: number;
  
      if (!this.erasing) {
        this.length++;
        render(phrase.slice(0, this.length));
        if (this.length >= phrase.length) {
          this.erasing = true;
          delay = holdMs;
        } else {
          delay = typeMs + Math.random() * 40; 
        }
      } else {
        this.length--;
        render(phrase.slice(0, this.length));
        if (this.length <= 0) {
          this.erasing = false;
          this.phraseIndex = (this.phraseIndex + 1) % phrases.length;
          delay = pauseMs;
        } else {
          delay = eraseMs;
        }
      }
  
      this.timer = setTimeout(() => this.tick(), delay);
    }
  }