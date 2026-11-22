import { Cloud, FLAG, INK, INK_2, INK_3, range, type RGB, type System } from "./field";

const scatter = (w: number, h: number) => (x: number, y: number): [number, number] => {
  const ang = Math.random() * Math.PI * 2;
  const rad = 40 + Math.random() * Math.max(w, h) * 0.55;
  return [x + Math.cos(ang) * rad, y + Math.sin(ang) * rad];
};

/** Dots along a horizontal bar, two dots thick. */
function bar(x: number, y: number, len: number, gap = 3): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= len; i += gap) {
    out.push([x + i, y]);
    out.push([x + i + 1.5, y + 2.6]);
  }
  return out;
}

function line(x1: number, y1: number, x2: number, y2: number, gap = 4): [number, number][] {
  const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / gap));
  return Array.from({ length: n + 1 }, (_, i) => [x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n] as [number, number]);
}

/* ClearBill: a bill's rows, then judged. */
function clearbill(w: number, h: number, fed = false) {
  const c = fed ? new Cloud((x, y) => [x, y], 0) : new Cloud(scatter(w, h));
  const verdicts = ["clear", "clear", "duplicate", "list1", "list1", "confirm", "confirm", "clear"];
  const itemLen = [0.62, 0.5, 0.5, 0.36, 0.44, 0.4, 0.34, 0.28];
  const dw = Math.min(w * 0.86, 520);
  const x0 = (w - dw) / 2;
  const top = h * 0.14;
  const rowH = Math.min((h * 0.74) / 9, 44);
  const chipW = dw * 0.2;
  const amtX = x0 + dw * 0.62;

  for (const [x, y] of bar(x0, top, dw * 0.3)) c.add(x, y, x, y, INK, INK_2, 1, 0.6);
  for (const [x, y] of bar(x0 + dw * 0.78, top, dw * 0.22)) c.add(x, y, x, y, INK, INK_2, 1, 0.6);
  for (const [x, y] of line(x0, top + rowH * 0.6, x0 + dw, top + rowH * 0.6, 4)) c.add(x, y, x, y, INK_3, INK_3, 0.8, 0.8);

  verdicts.forEach((v, i) => {
    const y = top + rowH * (i + 1.2);
    const item = bar(x0 + 22, y, dw * itemLen[i]);
    const amt = bar(amtX, y, dw * 0.1);
    for (const [x, yy] of bar(x0, y, 8)) c.add(x, yy, x, yy, INK_2, INK_3, 0.8, 0.6);
    item.forEach(([x, yy], k) => {
      if (v === "list1") c.add(x, yy, x, yy, INK, FLAG);
      else if (v === "confirm") {
        const on = Math.floor(k / 6) % 2 === 0;
        c.add(x, yy, x, yy, INK, INK_2, 1, on ? 1 : 0);
      } else if (v === "duplicate") c.add(x, yy, x, yy, INK, INK);
      else c.add(x, yy, x, yy, INK, INK_2, 1, 0.55);
    });
    for (const [x, yy] of amt) c.add(x, yy, x, yy, INK, v === "list1" ? FLAG : INK_2, 1, v === "clear" ? 0.55 : 1);
    for (const [x, yy] of line(x0, y + rowH * 0.5, x0 + dw, y + rowH * 0.5, 5)) c.add(x, yy, x, yy, INK_3, INK_3, 0.5, 0.5);

    if (v !== "clear") {
      const cx = x0 + dw - chipW;
      const cy = y - 6;
      const chH = 16;
      const col = v === "list1" ? FLAG : INK;
      const outline = [
        ...line(cx, cy, cx + chipW, cy, 3),
        ...line(cx, cy + chH, cx + chipW, cy + chH, 3),
        ...line(cx, cy, cx, cy + chH, 3),
        ...line(cx + chipW, cy, cx + chipW, cy + chH, 3),
      ];
      outline.forEach(([x, yy], k) => {
        const hide = v === "confirm" && Math.floor(k / 3) % 2 === 1;
        c.add(x0 + Math.random() * dw, y, x, yy, INK, col, 0, hide ? 0 : 1);
      });
      if (v === "list1") {
        for (let yy = cy + 3; yy < cy + chH - 1; yy += 3) for (const [x] of bar(cx + 3, 0, chipW - 6, 3)) c.add(x0 + Math.random() * dw, y, x, yy, INK, FLAG, 0, 0.9);
      }
    }
  });

  const y2 = top + rowH * 2.2;
  const y3 = top + rowH * 3.2;
  const bx = x0 - 14;
  [...line(bx, y2, bx, y3, 3), ...line(bx, y2, bx + 8, y2, 3), ...line(bx, y3, bx + 8, y3, 3)].forEach(([x, y]) =>
    c.add(x0 + Math.random() * dw * 0.4, y2, x, y, INK, INK, 0, 1),
  );
  return c;
}

/* IBM: a chain of batch jobs, compressed from 50 to 35 minutes. */
function ibm(w: number, h: number) {
  const c = new Cloud(scatter(w, h));
  const before = [9, 7, 12, 6, 10, 6];
  const after = [9, 4, 6, 6, 5, 5];
  const x0 = w * 0.08;
  const axisW = w * 0.84;
  const unit = axisW / 50;
  const top = h * 0.16;
  const rowH = Math.min((h * 0.6) / before.length, 52);
  let s1 = 0;
  let s2 = 0;
  before.forEach((d, i) => {
    const y = top + i * rowH;
    const len1 = d * unit;
    const len2 = after[i] * unit;
    const tuned = after[i] < d;
    const n = Math.max(2, Math.round(len1 / 3));
    for (let k = 0; k <= n; k++) {
      const f = k / n;
      for (const dy of [0, 3, 6]) {
        c.add(x0 + s1 * unit + f * len1, y + dy, x0 + s2 * unit + f * len2, y + dy, INK, tuned ? INK : INK_2, 1, tuned ? 1 : 0.7);
      }
    }
    s1 += d;
    s2 += after[i];
  });
  const axisY = top + before.length * rowH + 10;
  for (const [x, y] of line(x0, axisY, x0 + axisW, axisY, 4)) c.add(x, y, x, y, INK_3, INK_3, 0.8, 0.8);
  for (let m = 0; m <= 50; m += 10) for (const [x, y] of line(x0 + m * unit, axisY, x0 + m * unit, axisY + 6, 3)) c.add(x, y, x, y, INK_3, INK_3, 0.8, 0.8);
  for (const [x, y] of line(x0 + 50 * unit, top - 12, x0 + 50 * unit, axisY, 4)) c.add(x, y, x0 + 35 * unit, y, INK, FLAG);
  for (const [x, y] of line(x0 + 35 * unit, top - 12, x0 + 50 * unit, top - 12, 4)) c.add(x0 + 50 * unit, y, x, y, INK, FLAG, 0, 0.9);
  return c;
}

/* Taxi pipeline: messy rows, bad ones dropped, the rest loaded into a clean table. */
function pipeline(w: number, h: number) {
  const c = new Cloud(scatter(w, h));
  const cols = 24;
  const rows = 40;
  const n = cols * rows;
  const leftW = w * 0.34;
  const lx = w * 0.04;
  const ty = h * 0.14;
  const th = h * 0.62;
  const rx = w * 0.5;
  const rw = w * 0.46;
  const order = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5);
  let kept = 0;
  let dropped = 0;
  const keptCols = 22;
  const cellW = rw / keptCols;
  const cellH = th / Math.ceil((n * 0.917) / keptCols);
  order.forEach((idx, k) => {
    const x1 = lx + (idx % cols) * (leftW / cols) + (Math.random() - 0.5) * 9;
    const y1 = ty + Math.floor(idx / cols) * (th / rows) + (Math.random() - 0.5) * 9;
    const bad = k % 12 === 0;
    if (bad) {
      const x2 = w * 0.28 + Math.random() * w * 0.18;
      const y2 = ty + th + 26 + Math.random() * 18 + (dropped++ % 3) * 2;
      c.add(x1, y1, x2, y2, INK, FLAG, 0.85, 0.95);
    } else {
      const x2 = rx + (kept % keptCols) * cellW;
      const y2 = ty + Math.floor(kept / keptCols) * cellH;
      kept++;
      c.add(x1, y1, x2, y2, INK, INK, 0.85, 1);
    }
  });
  for (const [x, y] of line(rx - 4, ty - 10, rx + rw, ty - 10, 3)) c.add(rx + Math.random() * rw, ty + th / 2, x, y, INK, INK_2, 0, 0.8);
  return c;
}

/* Fashion recommender: the catalogue as vectors, then a photo → its vector → the 8 nearest products. */
const TEE: [number, number][] = [
  [0.3, 0], [0.42, 0], [0.5, 0.1], [0.58, 0], [0.7, 0], [1, 0.22], [0.87, 0.4], [0.76, 0.31],
  [0.76, 1], [0.24, 1], [0.24, 0.31], [0.13, 0.4], [0, 0.22],
];

function inside(poly: [number, number][], x: number, y: number) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

type Dot = { x: number; y: number; col: RGB; a: number };

/** A T-shirt filled with dots, with a chest stripe; `lime` marks the collar region the model looked at. */
function tee(out: Dot[], x0: number, y0: number, w: number, h: number, step: number, body: RGB, stripe: RGB, lime = false) {
  for (let y = 0; y <= h; y += step) {
    for (let x = 0; x <= w; x += step) {
      const u = x / w;
      const v = y / h;
      if (!inside(TEE, u, v)) continue;
      const inStripe = v > 0.48 && v < 0.58;
      const inCollar = lime && v < 0.24 && u > 0.3 && u < 0.7;
      out.push({ x: x0 + x, y: y0 + y, col: inCollar ? FLAG : inStripe ? stripe : body, a: 1 });
    }
  }
}

function frame(out: Dot[], x: number, y: number, w: number, h: number, col: RGB, a = 0.7) {
  for (const [px, py] of [...line(x, y, x + w, y, 4), ...line(x + w, y, x + w, y + h, 4), ...line(x + w, y + h, x, y + h, 4), ...line(x, y + h, x, y, 4)])
    out.push({ x: px, y: py, col, a });
}

function fashion(w: number, h: number) {
  const c = new Cloud(scatter(w, h));

  const before: Dot[] = [];
  const centers = [
    [0.16, 0.26], [0.4, 0.18], [0.66, 0.24], [0.88, 0.36],
    [0.22, 0.66], [0.5, 0.58], [0.78, 0.74],
  ].map(([x, y]) => [x * w, y * h]);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.85;
  centers.forEach(([cx, cy], k) => {
    for (let i = 0; i < 42; i++) {
      const x = cx + gauss() * w * 0.065;
      const y = cy + gauss() * h * 0.08;
      for (let d = 0; d < 4; d++) before.push({ x: x + (Math.random() - 0.5) * 3, y: y + (Math.random() - 0.5) * 3, col: k === 5 ? INK : INK_2, a: 0.85 });
    }
  });

  const after: Dot[] = [];
  const qx = w * 0.02;
  const qy = h * 0.14;
  const qw = w * 0.28;
  const qh = h * 0.66;
  frame(after, qx, qy, qw, qh, INK_3);
  const tw = qw * 0.78;
  const th = Math.min(tw * 0.95, qh * 0.8);
  tee(after, qx + (qw - tw) / 2, qy + (qh - th) / 2, tw, th, 4, INK, INK_2, true);

  const ay = qy + qh / 2;
  const ax0 = qx + qw + w * 0.025;
  const ax1 = w * 0.49;
  for (const [x, y] of line(ax0, ay, ax1, ay, 5)) after.push({ x, y, col: INK_2, a: 0.8 });
  for (const [x, y] of [...line(ax1 - 9, ay - 7, ax1, ay, 3), ...line(ax1 - 9, ay + 7, ax1, ay, 3)]) after.push({ x, y, col: INK_2, a: 0.9 });
  const bars = 12;
  const bw = (ax1 - ax0 - 24) / bars;
  for (let i = 0; i < bars; i++) {
    const bh = 8 + Math.abs(Math.sin(i * 1.7 + 0.4)) * 34;
    for (const [x, y] of line(ax0 + 6 + i * bw, ay - 6, ax0 + 6 + i * bw, ay - 6 - bh, 3)) after.push({ x, y, col: INK, a: 0.9 });
  }

  const gx = w * 0.53;
  const gw = w * 0.45;
  const gap = w * 0.018;
  const cw = (gw - gap * 3) / 4;
  const chh = (qh - gap) / 2;
  for (let r = 0; r < 2; r++) {
    for (let k = 0; k < 4; k++) {
      const x = gx + k * (cw + gap);
      const y = qy + r * (chh + gap);
      frame(after, x, y, cw, chh, INK_3, 0.6);
      const sw = cw * (0.74 + ((r * 4 + k) % 3) * 0.06);
      const sh = Math.min(sw * 0.95, chh * 0.78);
      tee(after, x + (cw - sw) / 2, y + (chh - sh) / 2, sw, sh, 3, INK_2, INK);
    }
  }

  const n = Math.max(before.length, after.length);
  for (let i = 0; i < n; i++) {
    const b = before[i % before.length];
    const t = after[i % after.length];
    c.add(b.x, b.y, t.x, t.y, b.col, t.col, i < before.length ? b.a : 0, i < after.length ? t.a : 0);
  }
  return c;
}

const billCache = new Map<string, Cloud>();

/** The ClearBill bill, cached so the hero stream and the illustration share exact positions. */
export function clearbillCloud(w: number, h: number, fed: boolean) {
  const key = `${Math.round(w)}x${Math.round(h)}:${fed}`;
  let c = billCache.get(key);
  if (!c) {
    c = clearbill(w, h, fed);
    billCache.set(key, c);
  }
  return c;
}

const builders: Record<string, (w: number, h: number) => Cloud> = {
  "ibm-batch": ibm,
  "taxi-pipeline": pipeline,
  "fashion-recommender": fashion,
};

/** Any project's illustration, as used by the pinned stage (the bill in its stream-fed form). */
export function projectCloud(slug: string, w: number, h: number) {
  if (slug === "clearbill") return clearbillCloud(w, h, true);
  return builders[slug]?.(w, h) ?? null;
}

/** `fed`: the ClearBill bill is delivered by the hero stream instead of assembling on its own. */
export function illustrations(fed: boolean): System[] {
  const out: System[] = [];
  for (const fig of document.querySelectorAll<HTMLElement>("[data-art]")) {
    const slug = fig.dataset.art ?? "";
    const isBill = slug === "clearbill";
    const build = isBill ? (w: number, h: number) => clearbillCloud(w, h, fed) : builders[slug];
    const box = fig.querySelector<HTMLElement>("[data-art-box]");
    if (!build || !box) continue;
    out.push({
      el: box,
      repel: true,
      size: 2.2,
      build,
      time: (r, vh) => {
        const mid = r.top + r.height / 2;
        if (isBill && fed) return range(mid, vh * 0.66, vh * 0.6) + range(mid, vh * 0.5, vh * 0.28);
        return range(mid, vh * 1.05, vh * 0.75) + range(mid, vh * 0.72, vh * 0.5);
      },
      onTime: (t) => fig.classList.toggle("is-after", t > 1.5),
    });
  }
  return out;
}
