import { animate } from "motion";
import { Cloud, range, type Field, type System } from "./field";
import { projectCloud } from "./illustrations";

type State = { p: Float32Array; c: Float32Array; a: Float32Array };

const MORPH_S = 1.0;
const HOLD_MS = 300;
const SWIRL = 90;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Selected work as one pinned stage. Each scroll step activates a project; one shared
 * set of particles morphs into that project's illustration on its own, then plays its
 * before → after change. The hero stream hands over to this set at state 0.
 */
export function stage(root: HTMLElement, pin: HTMLElement, box: HTMLElement) {
  const projects = [...pin.querySelectorAll<HTMLElement>("[data-project]")];
  const counter = root.querySelector<HTMLElement>("[data-stage-i]");
  const slugs = projects.map((p) => p.dataset.slug ?? "");

  let states: State[] = [];
  let size = "";
  let rand = new Float32Array(0);
  let from: State | null = null;
  let to: State | null = null;
  let toIndex = 0;
  const prog = { v: 1 };
  let anim: { stop: () => void } | null = null;
  let hold = 0;
  let field: Field | null = null;
  let active = -1;
  let entered = false;
  let clock = 0;

  const makeStates = (w: number, h: number) => {
    const clouds = slugs.map((s) => projectCloud(s, w, h)).filter((c): c is Cloud => Boolean(c));
    const n = Math.max(...clouds.map((c) => c.count));
    rand = Float32Array.from({ length: n }, () => Math.random());
    states = [];
    for (const c of clouds) {
      for (const k of [1, 2] as const) {
        const st: State = { p: new Float32Array(n * 2), c: new Float32Array(n * 3), a: new Float32Array(n) };
        const pos = k === 1 ? c.k1 : c.k2;
        const col = k === 1 ? c.c1 : c.c2;
        for (let i = 0; i < n; i++) {
          const j = i % c.count;
          st.p[i * 2] = pos[j * 2];
          st.p[i * 2 + 1] = pos[j * 2 + 1];
          st.c.set(col.slice(j * 3, j * 3 + 3), i * 3);
          st.a[i] = i < c.count ? c.a[j * 3 + k] : 0;
        }
        states.push(st);
      }
    }
  };

  const current = (): State => {
    if (!from || !to) return states[toIndex];
    const n = rand.length;
    const out: State = { p: new Float32Array(n * 2), c: new Float32Array(n * 3), a: new Float32Array(n) };
    const t = clock / 1000;
    for (let i = 0; i < n; i++) {
      const r = rand[i];
      const e = ease(Math.min(1, Math.max(0, prog.v * 1.6 - r * 0.6)));
      const arc = Math.sin(Math.PI * e) * SWIRL;
      out.p[i * 2] = from.p[i * 2] + (to.p[i * 2] - from.p[i * 2]) * e + (Math.sin(r * 41 + t * 0.6) * 0.6 + 0.8) * arc;
      out.p[i * 2 + 1] = from.p[i * 2 + 1] + (to.p[i * 2 + 1] - from.p[i * 2 + 1]) * e + Math.cos(r * 23) * 0.35 * arc;
      for (let k = 0; k < 3; k++) out.c[i * 3 + k] = from.c[i * 3 + k] + (to.c[i * 3 + k] - from.c[i * 3 + k]) * e;
      out.a[i] = from.a[i] + (to.a[i] - from.a[i]) * e;
    }
    return out;
  };

  const system: System = {
    el: box,
    repel: true,
    size: 2.2,
    swirl: SWIRL,
    build: (w, h) => {
      const key = `${Math.round(w)}x${Math.round(h)}`;
      if (key !== size) {
        size = key;
        makeStates(w, h);
        from = to = states[toIndex];
        prog.v = 1;
      }
      const c = new Cloud((x, y) => [x, y], 0);
      const f = from ?? states[0];
      const t = to ?? states[0];
      c.k1 = Array.from(f.p);
      c.k0 = c.k1;
      c.k2 = Array.from(t.p);
      c.c1 = Array.from(f.c);
      c.c2 = Array.from(t.c);
      c.r = Array.from(rand);
      c.a = [];
      for (let i = 0; i < rand.length; i++) c.a.push(f.a[i], f.a[i], t.a[i]);
      return c;
    },
    time: () => {
      clock = performance.now();
      return 1 + prog.v;
    },
    alpha: (_r, vh) => {
      const r = root.getBoundingClientRect();
      return range(r.top, vh * 0.04, 0) * (1 - range(vh - r.bottom, 0, vh * 0.04));
    },
  };

  const goTo = (idx: number, instant = false) => {
    if (!states.length) return;
    if (idx === toIndex && !instant && prog.v >= 1) return;
    from = instant ? states[idx] : current();
    to = states[idx];
    toIndex = idx;
    anim?.stop();
    prog.v = instant ? 1 : 0;
    field?.refresh(system);
    if (!instant) {
      anim = animate(0, 1, {
        duration: MORPH_S,
        ease: "linear",
        onUpdate: (v) => {
          prog.v = v;
        },
      });
    }
    const p = Math.floor(idx / 2);
    projects[p]?.querySelector("[data-art]")?.classList.toggle("is-after", idx % 2 === 1);
  };

  const activate = (i: number) => {
    active = i;
    projects.forEach((p, k) => {
      p.classList.toggle("is-active", k === i);
      p.classList.toggle("is-past", k < i);
      p.toggleAttribute("inert", k !== i);
    });
    if (counter && counter.textContent !== String(i + 1)) {
      counter.textContent = String(i + 1);
      animate(counter, { y: ["70%", "0%"], opacity: [0, 1] }, { type: "spring", bounce: 0.3, visualDuration: 0.45 });
    }
    clearTimeout(hold);
    goTo(i * 2);
    hold = window.setTimeout(() => goTo(i * 2 + 1), MORPH_S * 1000 * (i === 0 && !entered ? 0.2 : 1) + HOLD_MS);
  };

  const onScroll = () => {
    const r = root.getBoundingClientRect();
    const vh = innerHeight;
    if (r.top > 1) {
      if (entered || active !== 0) {
        entered = false;
        clearTimeout(hold);
        activate(0);
        clearTimeout(hold);
        goTo(0, true);
      }
      return;
    }
    const i = Math.min(projects.length - 1, Math.max(0, Math.floor(-r.top / vh)));
    if (!entered) {
      entered = true;
      activate(i);
      return;
    }
    if (i !== active) activate(i);
  };

  /** Scroll position at which the stage releases its pin. */
  const departY = () => root.getBoundingClientRect().top + scrollY + root.offsetHeight - innerHeight;

  /** The last illustration's particles, where they sit at the moment the stage releases. */
  const finalSource = () => {
    const last = states[states.length - 1];
    if (!last) return null;
    const b = box.getBoundingClientRect();
    const p = pin.getBoundingClientRect();
    return {
      pts: Array.from(last.p),
      cols: Array.from(last.c),
      alphas: Array.from(last.a),
      docLeft: b.left + scrollX,
      docTop: departY() + (b.top - p.top),
    };
  };

  return {
    system,
    departY,
    finalSource,
    start: (f: Field) => {
      field = f;
      document.documentElement.classList.add("stage");
      activate(0);
      clearTimeout(hold);
      addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    },
  };
}
