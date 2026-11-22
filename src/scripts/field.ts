export type RGB = readonly [number, number, number];
export const INK: RGB = [0.929, 0.91, 0.875];
export const INK_2: RGB = [0.64, 0.616, 0.573];
export const INK_3: RGB = [0.435, 0.416, 0.38];
export const FLAG: RGB = [0.941, 0.337, 0.18];

/**
 * A point cloud with three keyframes: k0 (dispersed), k1 (assembled), k2 (transformed).
 * Positions are in CSS px, relative to the anchor element's top-left corner.
 */
export class Cloud {
  k0: number[] = [];
  k1: number[] = [];
  k2: number[] = [];
  c1: number[] = [];
  c2: number[] = [];
  a: number[] = [];
  r: number[] = [];

  constructor(
    private spread: (x: number, y: number) => [number, number],
    private a0Default = 0.12,
  ) {}

  add(x1: number, y1: number, x2: number, y2: number, col1: RGB, col2: RGB, a1 = 1, a2 = 1, a0 = this.a0Default) {
    const [x0, y0] = this.spread(x1, y1);
    this.k0.push(x0, y0);
    this.k1.push(x1, y1);
    this.k2.push(x2, y2);
    this.c1.push(...col1);
    this.c2.push(...col2);
    this.a.push(a0, a1, a2);
    this.r.push(Math.random());
  }

  get count() {
    return this.r.length;
  }
}

export type System = {
  el: HTMLElement;
  build: (w: number, h: number) => Cloud;
  /** Map the anchor's viewport rect to a keyframe time in [0, 2]. */
  time: (rect: DOMRect, vh: number) => number;
  onTime?: (t: number) => void;
  /** Overall opacity of the system, from the anchor's viewport rect. */
  alpha?: (rect: DOMRect, vh: number) => number;
  /** Sideways bulge, in px, applied mid-way through the k1 → k2 move. */
  swirl?: number;
  /** Fraction of the timeline each particle takes to move. Small values make particles move strictly in `aRand` order. */
  win?: number;
  /** While assembled, a few particles stray up to this many px off the shape and settle back. */
  idle?: number;
  /** Where the k1 → k2 move starts on the timeline. Defaults to 1. */
  phase2?: number;
  /** Skip drawing when the anchor is off-screen. Off for systems that travel beyond their anchor. */
  cull?: boolean;
  repel?: boolean;
  size?: number;
};

type Live = System & { src: System; buffers: Map<string, WebGLBuffer>; count: number; w: number; h: number; t: number };

export type Field = {
  /** Rebuild and re-upload one system's particles, e.g. after its keyframes change. */
  refresh: (s: System) => void;
};

const VERT = `
attribute vec2 aK0;
attribute vec2 aK1;
attribute vec2 aK2;
attribute vec3 aC1;
attribute vec3 aC2;
attribute vec3 aA;
attribute float aRand;

uniform vec2 uRes;
uniform vec2 uOff;
uniform vec2 uMouse;
uniform float uT;
uniform float uTime;
uniform float uRepel;
uniform float uDpr;
uniform float uSize;
uniform float uAlpha;
uniform float uSwirl;
uniform float uWin;
uniform float uPhase2;
uniform float uIdle;

varying vec3 vCol;
varying float vA;

float ease(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

void main() {
  float lead = aRand * (1.0 - uWin);
  float e1 = ease(clamp((uT - lead) / uWin, 0.0, 1.0));
  float e2 = ease(clamp((uT - uPhase2 - lead) / uWin, 0.0, 1.0));

  vec2 drift = vec2(sin(uTime * 0.8 + aRand * 6.283), cos(uTime * 0.7 + aRand * 9.0));
  vec2 p = mix(aK0 + drift * 6.0, aK1 + drift * 0.6, e1);
  p = mix(p, aK2 + drift * 0.6, e2);
  float rest = e1 * (1.0 - e2) * step(0.001, uIdle);
  float loose = step(fract(aRand * 97.13), 0.14);
  float cyc = fract(uTime * 0.16 + fract(aRand * 13.7));
  float pulse = sin(3.14159 * clamp(cyc * 2.2, 0.0, 1.0));
  float dir = aRand * 61.0;
  float stray = loose * pulse * rest;
  p += vec2(cos(dir), sin(dir)) * stray * uIdle * (0.5 + fract(aRand * 7.3));
  float arc = sin(3.14159 * e2);
  p += vec2(sin(aRand * 41.0 + uTime * 0.6) * 0.6 + 0.8, cos(aRand * 23.0) * 0.35) * arc * uSwirl;
  p += uOff;

  vec2 d = p - uMouse;
  float push = max(0.0, 90.0 - length(d)) / 90.0;
  p += normalize(d + 0.0001) * push * push * 28.0 * uRepel;

  vec2 clip = (p / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = uSize * uDpr;

  vCol = mix(aC1, aC2, e2);
  vA = mix(mix(aA.x, aA.y, e1), aA.z, e2) * uAlpha * (1.0 - 0.45 * stray);
}
`;

const FRAG = `
precision mediump float;
varying vec3 vCol;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.3, d) * vA;
  gl_FragColor = vec4(vCol * a, a);
}
`;

const ATTRS = { aK0: 2, aK1: 2, aK2: 2, aC1: 3, aC2: 3, aA: 3, aRand: 1 } as const;

export function startField(systems: System[], reduce: boolean): Field | null {
  if (!systems.length) return null;
  const canvas = document.createElement("canvas");
  canvas.className = "field";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "2",
  });
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;
  const prog = makeProgram(gl, VERT, FRAG);
  if (!prog) return null;
  document.body.appendChild(canvas);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const U = {
    res: u("uRes"),
    off: u("uOff"),
    mouse: u("uMouse"),
    t: u("uT"),
    time: u("uTime"),
    repel: u("uRepel"),
    dpr: u("uDpr"),
    size: u("uSize"),
    alpha: u("uAlpha"),
    swirl: u("uSwirl"),
    win: u("uWin"),
    phase2: u("uPhase2"),
    idle: u("uIdle"),
  };
  const locs = Object.fromEntries(Object.keys(ATTRS).map((k) => [k, gl.getAttribLocation(prog, k)]));

  let dpr = 1;
  let vw = 0;
  let vh = 0;
  const mouse = { x: -9999, y: -9999 };

  const live: Live[] = systems.map((s) => ({ ...s, src: s, buffers: new Map(), count: 0, w: 0, h: 0, t: -1 }));
  let ready = false;

  const upload = (s: Live) => {
    const r = s.el.getBoundingClientRect();
    s.w = r.width;
    s.h = r.height;
    const c = s.build(r.width, r.height);
    s.count = c.count;
    const data: Record<string, number[]> = { aK0: c.k0, aK1: c.k1, aK2: c.k2, aC1: c.c1, aC2: c.c2, aA: c.a, aRand: c.r };
    for (const k of Object.keys(ATTRS)) {
      let b = s.buffers.get(k);
      if (!b) {
        b = gl.createBuffer()!;
        s.buffers.set(k, b);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data[k]), gl.STATIC_DRAW);
    }
  };

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    vw = innerWidth;
    vh = innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
  };

  const frame = (now: number) => {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform2f(U.res, vw, vh);
    gl.uniform2f(U.mouse, mouse.x, mouse.y);
    gl.uniform1f(U.time, reduce ? 0 : now / 1000);
    gl.uniform1f(U.dpr, dpr);

    for (const s of live) {
      const r = s.el.getBoundingClientRect();
      const t = reduce ? 2 : s.time(r, vh);
      if (t !== s.t) {
        s.t = t;
        s.onTime?.(t);
      }
      const alpha = s.alpha ? s.alpha(r, vh) : 1;
      if (!s.count || alpha <= 0.001) continue;
      if (s.cull !== false && (r.bottom < -120 || r.top > vh + 120)) continue;
      for (const [k, size] of Object.entries(ATTRS)) {
        const loc = locs[k];
        if (loc < 0) continue;
        gl.bindBuffer(gl.ARRAY_BUFFER, s.buffers.get(k)!);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      }
      gl.uniform2f(U.off, r.left, r.top);
      gl.uniform1f(U.t, t);
      gl.uniform1f(U.repel, s.repel && !reduce ? 1 : 0);
      gl.uniform1f(U.size, s.size ?? 2);
      gl.uniform1f(U.alpha, alpha);
      gl.uniform1f(U.swirl, reduce ? 0 : (s.swirl ?? 0));
      gl.uniform1f(U.win, s.win ?? 0.625);
      gl.uniform1f(U.phase2, s.phase2 ?? 1);
      gl.uniform1f(U.idle, reduce ? 0 : (s.idle ?? 0));
      gl.drawArrays(gl.POINTS, 0, s.count);
    }
    requestAnimationFrame(frame);
  };

  addEventListener(
    "pointermove",
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => {
    mouse.x = mouse.y = -9999;
  });

  document.fonts.ready.then(() => {
    resize();
    live.forEach(upload);
    ready = true;
    requestAnimationFrame(frame);
  });

  let timer = 0;
  addEventListener("resize", () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      resize();
      live.forEach((s) => {
        const r = s.el.getBoundingClientRect();
        if (Math.abs(r.width - s.w) > 1 || Math.abs(r.height - s.h) > 1) upload(s);
      });
    }, 150);
  });

  return {
    refresh: (sys) => {
      const l = live.find((x) => x.src === sys);
      if (l && ready) upload(l);
    },
  };
}

export const range = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));

/** Sample the ink of an element's text, word by word, relative to the element. */
export function sampleText(el: HTMLElement, step: number): [number, number][] {
  const box = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const W = Math.ceil(box.width) + 20;
  const H = Math.ceil(box.height) + 20;
  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const ctx = off.getContext("2d", { willReadFrequently: true })!;
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
    cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent ?? "";
    const re = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const r = range.getBoundingClientRect();
      const mt = ctx.measureText(m[0]);
      const asc = mt.fontBoundingBoxAscent;
      const desc = mt.fontBoundingBoxDescent;
      const baseline = r.top - box.top + (r.height - (asc + desc)) / 2 + asc;
      ctx.fillText(m[0], r.left - box.left, baseline);
    }
  }

  const img = ctx.getImageData(0, 0, W, H).data;
  const pts: [number, number][] = [];
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (img[(y * W + x) * 4 + 3] > 110) pts.push([x + (Math.random() - 0.5) * 0.8, y + (Math.random() - 0.5) * 0.8]);
    }
  }
  return pts;
}

/** A headline that assembles from scattered particles, then hands over to the real text. */
export function headline(el: HTMLElement): System {
  return {
    el,
    size: 2,
    build: (w, h) => {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const step = Math.max(2, Math.round(fs / 34));
      const c = new Cloud((x, y) => {
        const ang = Math.random() * Math.PI * 2;
        const rad = 50 + Math.random() * Math.max(w * 0.3, 160);
        return [x + Math.cos(ang) * rad, y + Math.sin(ang) * rad * 0.7];
      });
      for (const [x, y] of sampleText(el, step)) c.add(x, y, x, y, INK, INK, 1, 0, 0);
      return c;
    },
    time: (r, vh) => range(r.top, vh * 0.95, vh * 0.55) + range(r.top, vh * 0.55, vh * 0.42),
    onTime: (t) => {
      el.style.opacity = String(Math.max(0, t - 1));
    },
  };
}

export function makeProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const v = compile(gl.VERTEX_SHADER, vs);
  const f = compile(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram()!;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}
