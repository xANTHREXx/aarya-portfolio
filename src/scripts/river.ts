import { animate } from "motion";
import { Cloud, FLAG, INK, range, sampleText, type RGB, type System } from "./field";
import { projectCloud } from "./illustrations";

/**
 * The hero headline, drawn in particles. On scroll its dots pour down the page
 * and land on the pinned work stage as the ClearBill bill, which takes over in place.
 */
export function river(head: HTMLElement, hero: HTMLElement, art: HTMLElement, root: HTMLElement, pin: HTMLElement): System {
  const intro = { v: 0 };
  animate(0, 1, {
    duration: 2.2,
    delay: 0.1,
    ease: [0.22, 1, 0.36, 1],
    onUpdate: (v) => {
      intro.v = v;
    },
  });

  const progress = (heroRect: DOMRect, vh: number) => {
    const travel = root.getBoundingClientRect().top - heroRect.top;
    return range(-heroRect.top, vh * 0.02, travel);
  };

  return {
    el: hero,
    cull: false,
    repel: true,
    size: 2.2,
    swirl: 150,
    idle: 12,
    build: (w, h) => {
      const hr = hero.getBoundingClientRect();
      const hd = head.getBoundingClientRect();
      const ar = art.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(head).fontSize);
      const pts = sampleText(head, Math.max(2, Math.round(fs / 60)));
      const acc = head.querySelector<HTMLElement>("[data-accent]")?.getBoundingClientRect();
      const isAccent = ([x, y]: [number, number]) =>
        Boolean(acc) && x + hd.left >= acc!.left - 2 && x + hd.left <= acc!.right + 2 && y + hd.top >= acc!.top + acc!.height * 0.24 && y + hd.top <= acc!.bottom;
      const bill = projectCloud("clearbill", ar.width, ar.height)!;
      const rr = root.getBoundingClientRect();
      const pr = pin.getBoundingClientRect();
      const ox = hd.left - hr.left;
      const oy = hd.top - hr.top;
      const bx = ar.left - hr.left;
      const by = rr.top - hr.top + (ar.top - pr.top);

      const c = new Cloud(() => [Math.random() * w, Math.random() * h * 1.1], 0.15);
      const n = Math.max(pts.length, bill.count);
      for (let i = 0; i < n; i++) {
        const pt = pts[i % pts.length];
        const [px, py] = pt;
        const j = i % bill.count;
        const col: RGB = [bill.c1[j * 3], bill.c1[j * 3 + 1], bill.c1[j * 3 + 2]];
        const a1 = i < pts.length ? 1 : 0;
        const a2 = i < bill.count ? bill.a[j * 3 + 1] : 0;
        c.add(ox + px, oy + py, bx + bill.k1[j * 2], by + bill.k1[j * 2 + 1], isAccent(pt) ? FLAG : INK, col, a1, a2);
      }
      return c;
    },
    time: (r, vh) => intro.v + progress(r, vh),
    alpha: (_r, vh) => 1 - range(root.getBoundingClientRect().top, vh * 0.04, 0),
  };
}
