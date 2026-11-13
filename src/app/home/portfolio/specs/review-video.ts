// src/app/utils/review-video.ts
//
// Shared helpers for playing a car's review video (hero background + hover previews).
// Works with direct video files (any URL, with or without an extension) and with
// YouTube / Vimeo / Streamable links.

/**
 * Base URL of the API/media server. Used when the API returns a relative
 * review-video path such as "/uploads/review.mp4". Change to your real host
 * (or read it from environment.ts).
 */
export const MEDIA_BASE = 'http://localhost:4000';

export type ReviewVideo =
  | { kind: 'file'; src: string }
  | { kind: 'embed'; src: string };

/** Cleans up whatever the API returns (spaces, //host, relative paths). */
export function normalizeVideoUrl(raw?: string | null): string | null {
  const u = (raw ?? '').toString().trim();
  if (!u) return null;
  if (u.startsWith('//')) return 'https:' + u;
  if (/^https?:\/\//i.test(u)) return u;
  // relative path from the API -> serve it from the media server
  return MEDIA_BASE.replace(/\/+$/, '') + '/' + u.replace(/^\/+/, '');
}

/** Muted, looping, controls-free embed URL for known hosts, otherwise null. */
export function embedFor(u: string): string | null {
  const yt = u.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i,
  );
  if (yt) {
    return (
      `https://www.youtube-nocookie.com/embed/${yt[1]}` +
      `?rel=0&autoplay=1&mute=1&loop=1&playlist=${yt[1]}&playsinline=1&controls=0&modestbranding=1`
    );
  }

  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1&loop=1&background=1`;

  const sm = u.match(/streamable\.com\/(?:e\/)?([a-z0-9]+)/i);
  if (sm) return `https://streamable.com/e/${sm[1]}?autoplay=1&muted=1&loop=1`;

  return null;
}

/**
 * Anything that is not a known embed host is played with a <video> tag,
 * even when the URL has no extension. If the browser can't play it, the
 * (error) handler on the element drops it again.
 */
export function resolveReviewVideo(raw?: string | null): ReviewVideo | null {
  const u = normalizeVideoUrl(raw);
  if (!u) return null;
  const embed = embedFor(u);
  return embed ? { kind: 'embed', src: embed } : { kind: 'file', src: u };
}

/**
 * Angular doesn't reflect the `muted` attribute onto dynamically created <video>
 * elements and browsers block autoplay unless the property is set, so set it
 * in code and start playback.
 */
export function primeMutedVideo(el: HTMLVideoElement): void {
  el.muted = true;
  el.defaultMuted = true;
  if (el.paused) {
    el.play().catch(() => { /* autoplay suppressed — the image / dark hero stays visible */ });
  }
}

/** Reveals a preview element (it is invisible until it is really playing / loaded). */
export function markReady(el: HTMLElement): void {
  el.classList.add('ready');
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function canHover(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
}