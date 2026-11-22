import { animate } from "motion";
import { Cloud, INK, sampleText, type System } from "./field";
import { caseCloud } from "./illustrations";

/** A case-page title drawn in particles: gathers on load, then rests with a few loose specks. */
export function caseTitle(el: HTMLElement): System {
  const intro = { v: 0 };
  animate(0, 1, {
    duration: 1.9,
    delay: 0.1,
    ease: [0.22, 1, 0.36, 1],
    onUpdate: (v) => {
      intro.v = v;
    },
  });

  return {
    el,
    size: 2,
    idle: 9,
    repel: true,
    build: (w, h) => {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const c = new Cloud((x, y) => [x + (Math.random() - 0.5) * w * 0.7, y + (Math.random() - 0.5) * h * 2.2], 0.1);
      for (const [x, y] of sampleText(el, Math.max(2, Math.round(fs / 46)))) c.add(x, y, x, y, INK, INK, 1, 1);
      return c;
    },
    time: () => intro.v,
  };
}

/**
 * A project's illustration on its case page: the same piece as on the homepage. Once a third of
 * it is in view, the particles assemble, hold for a moment, then play the before → after change.
 */
export function caseArt(box: HTMLElement, slug: string): System {
  const t = { v: 0 };
  const run = () => {
    animate(0, 1, {
      duration: 1.3,
      ease: "linear",
      onUpdate: (v) => {
        t.v = v;
      },
    }).then(() => {
      window.setTimeout(() => {
        animate(1, 2, {
          duration: 1.3,
          ease: "linear",
          onUpdate: (v) => {
            t.v = v;
          },
        });
      }, 500);
    });
  };
  const io = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      run();
    },
    { threshold: 0.3 },
  );
  io.observe(box);

  return {
    el: box,
    repel: true,
    size: 2.2,
    build: (w, h) => caseCloud(slug, w, h),
    time: () => t.v,
  };
}
