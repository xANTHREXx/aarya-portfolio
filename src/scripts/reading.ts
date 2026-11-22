import { Cloud, FLAG, INK, range, sampleText, type System } from "./field";

const WIN = 0.14;
const PHASE2 = 0.1;

/**
 * A statement assembled by scrolling. Each word is built from particles that rise into place in
 * reading order, then hands over to the real text. Words marked `data-mark` assemble in the accent
 * colour and get a dotted underline that draws itself and stays.
 */
export function reading(block: HTMLElement, para: HTMLElement): System {
  const words = [...para.querySelectorAll<HTMLElement>(".rw")];
  const n = words.length;
  const span = 1 - WIN;
  const order = (i: number) => i / n;

  return {
    el: para,
    size: 1.8,
    win: WIN,
    phase2: PHASE2,
    build: () => {
      for (const w of words) if (!w.style.opacity) w.style.opacity = "0";
      const pr = para.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(para).fontSize);
      const step = Math.max(2, Math.round(fs / 22));
      const c = new Cloud((x, y) => [x + (Math.random() - 0.5) * 50, y + 30 + Math.random() * 60], 0);

      words.forEach((w, i) => {
        const wr = w.getBoundingClientRect();
        const ox = wr.left - pr.left;
        const oy = wr.top - pr.top;
        const mark = w.dataset.mark !== undefined;
        const col = mark ? FLAG : INK;
        for (const [x, y] of sampleText(w, step)) {
          c.add(ox + x, oy + y, ox + x, oy + y, col, col, 1, 0);
          c.r[c.r.length - 1] = order(i) + (Math.random() * 1.5) / n;
        }
        if (mark) {
          const y = oy + wr.height * 0.98;
          for (let x = 0; x <= wr.width; x += 3) {
            c.add(ox + x, y, ox + x, y + (Math.random() - 0.5) * 1.2, FLAG, FLAG, 0, 0.9);
            c.r[c.r.length - 1] = order(i) + ((x / wr.width) * 3) / n;
          }
        }
      });
      return c;
    },
    time: (_r, vh) => {
      const b = block.getBoundingClientRect();
      const p = range(-b.top, 0, b.height - vh);
      return p * (1 + PHASE2);
    },
    onTime: (t) => {
      words.forEach((w, i) => {
        const lead = (order(i) + 0.75 / n) * span;
        w.style.opacity = String(range(t - PHASE2, lead + WIN * 0.2, lead + WIN));
      });
    },
  };
}
