import { animate } from "motion";
import { Cloud, FLAG, INK, range, sampleText, type System } from "./field";

/**
 * Phone hero: the headline is drawn in dots. They gather out of the dark on load, shimmer while the
 * page rests, shy away from a finger, and lift off and thin out as you scroll past. The real <h1>
 * stays in the DOM (transparent) for reading, selecting and assistive tech.
 */
export function heroDust(head: HTMLElement, hero: HTMLElement): System {
  const intro = { v: 0 };
  animate(0, 1, {
    duration: 2.4,
    delay: 0.15,
    ease: [0.22, 1, 0.36, 1],
    onUpdate: (v) => {
      intro.v = v;
    },
  });

  return {
    el: hero,
    repel: true,
    size: 2,
    swirl: 70,
    idle: 9,
    win: 0.5,
    build: (w, h) => {
      const hr = hero.getBoundingClientRect();
      const hd = head.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(head).fontSize);
      const pts = sampleText(head, Math.max(2, Math.round(fs / 46)));
      const acc = head.querySelector<HTMLElement>("[data-accent]")?.getBoundingClientRect();
      const isAccent = ([x, y]: [number, number]) =>
        Boolean(acc) &&
        x + hd.left >= acc!.left - 2 &&
        x + hd.left <= acc!.right + 2 &&
        y + hd.top >= acc!.top + acc!.height * 0.24 &&
        y + hd.top <= acc!.bottom;

      const ox = hd.left - hr.left;
      const oy = hd.top - hr.top;
      // Start dispersed across the hero; leave drifting up and sideways.
      const c = new Cloud(() => [Math.random() * w, Math.random() * h], 0.1);
      for (const pt of pts) {
        const col = isAccent(pt) ? FLAG : INK;
        const x = ox + pt[0];
        const y = oy + pt[1];
        c.add(x, y, x + (Math.random() - 0.5) * 140, y - 90 - Math.random() * 220, col, col, 1, 0);
      }
      return c;
    },
    time: (r) => intro.v + range(-r.top, 0, r.height * 0.7),
  };
}
