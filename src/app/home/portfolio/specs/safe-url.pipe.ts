// src/app/home/portfolio/specs/safe-url.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Trusts only known video-embed hosts so `[src]` on an <iframe> will render.
 * Anything else is returned un-sanitised (Angular will block it) — safe default.
 */
@Pipe({ name: 'safeVideoUrl', standalone: true })
export class SafeVideoUrlPipe implements PipeTransform {
  private static readonly ALLOWED = [
    'https://www.youtube.com/embed/',
    'https://www.youtube-nocookie.com/embed/',
    'https://player.vimeo.com/video/',
    'https://streamable.com/e/',          // ← added
  ];

  constructor(private s: DomSanitizer) {}

  transform(url: string | null | undefined): SafeResourceUrl | null {
    if (!url) return null;
    const ok = SafeVideoUrlPipe.ALLOWED.some((p) => url.startsWith(p));
    return ok ? this.s.bypassSecurityTrustResourceUrl(url) : null;
  }
}