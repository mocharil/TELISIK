import { useEffect, type RefObject } from 'react';

const revealTargets = [
  '.tl-intro', '.tl-hero h1', '.tl-hero-copy > p', '.tl-hero-actions',
  '.tl-hero-trust', '.tl-hero-art', '.tf-intent-strip p',
  '.tf-features-intro > *', '.tf-feature-copy > *', '.tf-feature-visual',
  '.tl-data-copy > *', '.tl-data-facts > div', '.tl-data-facts > footer',
  '.tl-faq-section > div:first-child > *', '.tl-faq-list details',
  '.tl-final-cta > img', '.tl-final-cta > div:not(.magic-border-beam)',
  '.tl-final-cta > a', '.tl-footer > .tl-container > *',
].join(',');

export function useScrollReveal(rootRef: RefObject<HTMLDivElement>, reducedMotion: boolean | null) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || !('IntersectionObserver' in window)) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>(revealTargets));
    const selected = new Set<Element>(targets);
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('tl-is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

    for (const target of targets) {
      const siblings = Array.from(target.parentElement?.children ?? []).filter(node => selected.has(node));
      const delay = Math.min(siblings.indexOf(target), 3) * 70;
      target.dataset.tlReveal = '';
      target.style.setProperty('--tl-reveal-delay', `${delay}ms`);
      observer.observe(target);
    }
    root.classList.add('tl-reveal-ready');

    // Keyboard navigation must never leave a focused control visually hidden.
    const revealFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest('[data-tl-reveal]');
      target?.classList.add('tl-is-visible');
      if (target) observer.unobserve(target);
    };
    root.addEventListener('focusin', revealFocus);
    return () => {
      observer.disconnect();
      root.removeEventListener('focusin', revealFocus);
      root.classList.remove('tl-reveal-ready');
      for (const target of targets) {
        delete target.dataset.tlReveal;
        target.classList.remove('tl-is-visible');
        target.style.removeProperty('--tl-reveal-delay');
      }
    };
  }, [rootRef, reducedMotion]);
}
