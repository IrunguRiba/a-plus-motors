

const BODY_CLASS = 'video-expanded';
const STYLE_ID = 'video-expanded-style';

const HIDE_CSS = `
body.${BODY_CLASS} app-nav,
body.${BODY_CLASS} nav,
body.${BODY_CLASS} header,
body.${BODY_CLASS} [role='navigation'],
body.${BODY_CLASS} .top-nav {
  visibility: hidden !important;
  pointer-events: none !important;
}`;
export function setVideoExpanded(on: boolean): void {
  if (typeof document === 'undefined') return;
  if (on && !document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = HIDE_CSS;
    document.head.appendChild(style);
  }
  document.body.classList.toggle(BODY_CLASS, on);
}

export function releaseMedia(el?: Element | null): void {
  if (!(el instanceof HTMLMediaElement)) return;
  try {
    el.pause();
    el.removeAttribute('src');
    el.load();
  } catch {
  }
}