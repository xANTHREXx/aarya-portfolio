import { Cloud, INK, INK_2, INK_3, range, sampleText, type RGB, type System } from "./field";
import { rdfRidgeline } from "@/components/ui/ridgeline-dither-footer";

/** Where a leg's particles start: flat [x, y, …] positions plus where they sit in the document. */
export type Source = () => {
  pts: number[];
  cols?: number[];
  alphas?: number[];
  docLeft: number;
  docTop: number;
} | null;

const step = (el: HTMLElement) => Math.max(2, Math.round(parseFloat(getComputedStyle(el).fontSize) / 34));

/** A heading's own text, as a source for the next leg. */
export function textSource(el: HTMLElement): Source {
  return () => {
    const r = el.getBoundingClientRect();
    return { pts: sampleText(el, step(el)).flat(), docLeft: r.left + scrollX, docTop: r.top + scrollY };
  };
}

/** When the target heading's top reaches the bottom of the viewport. */
export const enterY = (el: HTMLElement) => () => el.getBoundingClientRect().top + scrollY - innerHeight;

type Shape = { pts: [number, number][]; cols?: RGB[] };

type LegOptions = {
  /** Scroll position at which the particles arrive. Defaults to the target's top at 42% of the viewport. */
  arrive?: () => number;
  /** The shape to assemble, relative to the target. Defaults to the target's text. */
  shape?: () => Shape;
  /** Hide the target until the particles arrive, then show it. Defaults to true. */
  handoff?: boolean;
};

/**
 * One leg of the journey: particles leave `source` at scroll position `depart()`, stream down
 * the page and assemble into `target`'s text, then hand over to the real heading, which stays.
 */
export function leg(target: HTMLElement, source: Source, depart: () => number, opts: LegOptions = {}): System {
  let prog = 0;
  const handoff = opts.handoff !== false;
  if (handoff) target.style.opacity = "0";

  return {
    el: target,
    cull: false,
    repel: true,
    size: 2,
    swirl: 120,
    build: () => {
      const tr = target.getBoundingClientRect();
      const shape = opts.shape ? opts.shape() : { pts: sampleText(target, step(target)) };
      const tp = shape.pts;
      const src = source();
      const c = new Cloud((x, y) => [x, y], 0);
      if (!src || !tp.length || !src.pts.length) return c;
      const sn = src.pts.length / 2;
      const tn = tp.length;
      const ox = src.docLeft - (tr.left + scrollX);
      const oy = src.docTop - (tr.top + scrollY);
      const n = Math.max(sn, tn);
      for (let i = 0; i < n; i++) {
        const si = i % sn;
        const [tx, ty] = tp[i % tn];
        const col: RGB = src.cols ? [src.cols[si * 3], src.cols[si * 3 + 1], src.cols[si * 3 + 2]] : INK;
        const a1 = i < sn ? (src.alphas ? src.alphas[si] : 1) : 0;
        const a2 = i < tn ? 1 : 0;
        c.add(src.pts[si * 2] + ox, src.pts[si * 2 + 1] + oy, tx, ty, col, shape.cols?.[i % tn] ?? INK, a1, a2, 0);
      }
      return c;
    },
    time: (r, vh) => {
      const arrive = opts.arrive ? opts.arrive() : r.top + scrollY - vh * 0.42;
      prog = range(scrollY, depart(), arrive);
      return 1 + prog;
    },
    alpha: () => Math.min(1, prog / 0.04) * (1 - range(prog, handoff ? 0.96 : 0.9, 1)),
    onTime: () => {
      if (handoff) target.style.opacity = String(range(prog, 0.9, 1));
    },
  };
}

/**
 * The footer's mountain range as points: the crest of each ridge plus a thinning fill below it,
 * built with the footer's own ridge function and settings so the particles land on its shapes.
 */
export function mountainShape(scene: HTMLElement, seed: number, layers: number, pixel = 2): () => Shape {
  return () => {
    const r = scene.getBoundingClientRect();
    const cols = Math.max(8, Math.ceil(r.width / pixel));
    const rows = Math.max(8, Math.ceil(r.height / pixel));
    const margin = Math.ceil(cols * 0.045) + 3;
    const ceil = Math.max(rows * 0.17, 92 / pixel);
    const pts: [number, number][] = [];
    const cols3: RGB[] = [];
    for (let i = 0; i < layers; i++) {
      const k = i / (layers - 1);
      const tops = rdfRidgeline(cols, rows, i, layers, seed, margin);
      const col: RGB = [
        INK_3[0] + (INK_2[0] - INK_3[0]) * k,
        INK_3[1] + (INK_2[1] - INK_3[1]) * k,
        INK_3[2] + (INK_2[2] - INK_3[2]) * k,
      ];
      const depth = rows * (0.06 + 0.2 * k);
      for (let x = 0; x < cols; x += 2) {
        let t = tops[x + margin];
        if (t < ceil) t = ceil - (ceil - t) * 0.2;
        pts.push([x * pixel, t * pixel]);
        cols3.push(col);
        for (let d = 3; d < depth; d += 3) {
          if (Math.random() < 0.55 * (1 - d / depth)) {
            pts.push([x * pixel + (Math.random() - 0.5) * pixel * 2, (t + d) * pixel]);
            cols3.push(col);
          }
        }
      }
    }
    return { pts, cols: cols3 };
  };
}
