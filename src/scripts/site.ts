import Lenis from "lenis";
import { animate, inView, stagger } from "motion";
import { headline, startField, type System } from "./field";
import { illustrations } from "./illustrations";
import { heroDust } from "./hero-dust";
import { river } from "./river";
import { stage } from "./stage";
import { enterY, leg, mountainShape, textSource } from "./journey";
import { reading } from "./reading";
import { footerRange } from "../data/site";

const easeOut = [0.16, 1, 0.3, 1] as const;

export function initSite() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  const lenis = reduce ? null : new Lenis({ autoRaf: true, lerp: 0.09 });
  if (lenis) wireAnchors(lenis);

  startClock();
  headerBehaviour();
  const riverOn = startParticles(reduce);
  reloadAcrossBreakpoint();
  heroEntrance(reduce);
  if (!riverOn) tagReveals();
  reveals(reduce);

  if (finePointer && !reduce) {
    cursor();
    magnetic();
  }
  if (!finePointer) touchFeel(reduce);
  if (matchMedia("(max-width: 760px)").matches) {
    dock();
    scrollProgress();
  }
}

/** Without the pinned stage (phones, tablets, reduced motion) each block rises in as it arrives. */
function tagReveals() {
  const sel = ".project-art, .project-copy, .about-cols, .exp-head, .exp-claims li, .exp-foot > div";
  for (const el of document.querySelectorAll<HTMLElement>(sel)) el.setAttribute("data-reveal", "");
}

/** Tap feedback and a light haptic on controls, for devices with no hover. */
function touchFeel(reduce: boolean) {
  const buzz = (ms: number) => {
    if (!reduce && "vibrate" in navigator) navigator.vibrate(ms);
  };
  document.addEventListener(
    "pointerdown",
    (e) => {
      const t = (e.target as Element).closest<HTMLElement>(".btn, .dock a, .art-link");
      if (!t) return;
      t.classList.add("is-pressed");
      buzz(8);
      const off = () => t.classList.remove("is-pressed");
      addEventListener("pointerup", off, { once: true });
      addEventListener("pointercancel", off, { once: true });
    },
    { passive: true },
  );
}

/** Section dock: marks the section in view and tucks away over the footer, which carries its own links. */
function dock() {
  const el = document.querySelector<HTMLElement>("[data-dock]");
  if (!el) return;
  const links = [...el.querySelectorAll<HTMLAnchorElement>("[data-dock-link]")];
  const sections = links
    .map((a) => document.getElementById(a.dataset.dockLink === "contact" ? "contact" : a.dataset.dockLink!))
    .filter((s): s is HTMLElement => Boolean(s));
  if (!sections.length) return;
  const mark = () => {
    const probe = innerHeight * 0.45;
    let cur = "";
    for (const s of sections) if (s.getBoundingClientRect().top <= probe) cur = s.id;
    for (const a of links) {
      if (a.dataset.dockLink === cur) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
  };
  let ticking = false;
  addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        mark();
        ticking = false;
      });
    },
    { passive: true },
  );
  mark();
}

function scrollProgress() {
  const bar = document.querySelector<HTMLElement>("[data-progress]");
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty("--p", String(max > 0 ? Math.min(1, scrollY / max) : 0));
  };
  addEventListener("scroll", update, { passive: true });
  update();
}

function wireAnchors(lenis: Lenis) {
  for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]')) {
    a.addEventListener("click", (e) => {
      const hash = a.getAttribute("href")!.replace(/^\//, "");
      const target = hash.length > 1 ? document.querySelector<HTMLElement>(hash) : null;
      if (!target || location.pathname !== "/") return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.4 });
      history.replaceState(null, "", hash);
    });
  }
}

function startClock() {
  const el = document.querySelector<HTMLTimeElement>("[data-clock]");
  if (!el) return;
  const fmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
  const tick = () => {
    el.textContent = fmt.format(new Date());
  };
  tick();
  setInterval(tick, 20_000);
}

function headerBehaviour() {
  const bar = document.querySelector<HTMLElement>("[data-bar]");
  if (!bar) return;
  let ticking = false;
  const update = () => {
    bar.classList.toggle("is-solid", scrollY > 40);
    ticking = false;
  };
  addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
}

function startParticles(reduce: boolean) {
  const head = document.querySelector<HTMLElement>("[data-hero-head]");
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  const art = document.querySelector<HTMLElement>('[data-art="clearbill"] [data-art-box]');
  const root = document.querySelector<HTMLElement>("[data-stage-root]");
  const pin = document.querySelector<HTMLElement>("[data-stage-pin]");
  const wide = matchMedia("(min-width: 1001px)").matches;
  const useStage = Boolean(head && hero && art && root && pin && wide && !reduce);

  const st = useStage ? stage(root!, pin!, art!) : null;
  const chain = ["#about-title", "#exp-title"]
    .map((sel) => document.querySelector<HTMLElement>(sel))
    .filter((el): el is HTMLElement => Boolean(el));
  if (st) {
    for (const t of document.querySelectorAll(".project-title[data-pt-head]")) t.removeAttribute("data-pt-head");
    for (const t of chain) t.removeAttribute("data-pt-head");
  }

  const footer = document.querySelector<HTMLElement>("[data-footer]");
  const scene = document.querySelector<HTMLElement>("[data-footer] .rdf-scene");
  const legs: System[] = st
    ? chain.map((t, i) => (i === 0 ? leg(t, st.finalSource, st.departY) : leg(t, textSource(chain[i - 1]), enterY(t))))
    : [];
  if (st && footer && scene && chain.length) {
    legs.push(
      leg(scene, textSource(chain[chain.length - 1]), enterY(footer), {
        handoff: false,
        shape: mountainShape(scene, footerRange.seed, footerRange.ridges, footerRange.pixel),
        arrive: () =>
          Math.min(
            scene.getBoundingClientRect().top + scrollY - innerHeight * 0.5,
            document.documentElement.scrollHeight - innerHeight - 2,
          ),
      }),
    );
  }

  const dust = !st && !reduce && head && hero ? heroDust(head, hero) : null;

  const readBlock = document.querySelector<HTMLElement>("[data-read-block]");
  const readPara = document.querySelector<HTMLElement>("[data-read]");
  const read = !reduce && readBlock && readPara ? reading(readBlock, readPara) : null;

  const systems: System[] = [
    ...[...document.querySelectorAll<HTMLElement>("[data-pt-head]")].map(headline),
    ...(st ? [river(head!, hero!, art!, root!, pin!), st.system, ...legs] : [...(dust ? [dust] : []), ...illustrations(false)]),
    ...(read ? [read] : []),
  ];

  const field = startField(systems, reduce);
  if (!field) return false;
  const html = document.documentElement;
  html.classList.add("pt");
  if (read) html.classList.add("read");
  if (dust) html.classList.add("river");
  if (st) {
    html.classList.add("river");
    st.start(field);
  }
  return Boolean(st);
}

function heroEntrance(reduce: boolean) {
  if (reduce) return;
  // The particle headline (desktop river or phone dust) replaces the line slide-in.
  if (!document.documentElement.classList.contains("river")) {
    const lines = document.querySelectorAll<HTMLElement>(".hl > span");
    animate(lines, { y: ["105%", "0%"] }, { duration: 1.1, delay: stagger(0.08, { startDelay: 0.1 }), ease: easeOut });
  }
  const rest = document.querySelectorAll<HTMLElement>(".hero-who, .hero-side");
  animate(rest, { opacity: [0, 1], y: [14, 0] }, { duration: 0.9, delay: stagger(0.1, { startDelay: 0.7 }), ease: easeOut });
}

function reveals(reduce: boolean) {
  if (reduce) return;
  for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
    if (el.getBoundingClientRect().top < innerHeight) continue;
    el.style.opacity = "0";
    inView(
      el,
      () => {
        animate(
          el,
          { opacity: [0, 1], y: [36, 0], filter: ["blur(10px)", "blur(0px)"] },
          { duration: 1, ease: easeOut },
        );
      },
      { amount: 0.35 },
    );
  }
}

function cursor() {
  const root = document.querySelector<HTMLElement>("[data-cursor-el]");
  const label = document.querySelector<HTMLElement>("[data-cursor-label]");
  if (!root || !label) return;
  document.documentElement.classList.add("has-cursor");

  let x = -100;
  let y = -100;
  let cx = x;
  let cy = y;
  let visible = false;

  addEventListener(
    "pointermove",
    (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        cx = x;
        cy = y;
        root.style.opacity = "1";
      }
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => {
    visible = false;
    root.style.opacity = "0";
  });
  addEventListener("pointerdown", () => root.classList.add("is-down"));
  addEventListener("pointerup", () => root.classList.remove("is-down"));

  const classify = (t: Element | null) => {
    if (!t) return;
    const labelled = t.closest<HTMLElement>("[data-cursor]");
    const link = t.closest("a, button");
    if (labelled) {
      label.textContent = labelled.dataset.cursor ?? "";
      root.classList.add("is-label");
      root.classList.remove("is-link");
      root.classList.toggle("is-invert", Boolean(labelled.closest(".btn")));
    } else if (link) {
      root.classList.add("is-link");
      root.classList.remove("is-label", "is-invert");
    } else {
      root.classList.remove("is-link", "is-label", "is-invert");
    }
  };
  document.addEventListener("pointerover", (e) => classify(e.target as Element));
  addEventListener("scroll", () => visible && classify(document.elementFromPoint(x, y)), { passive: true });

  const loop = () => {
    cx += (x - cx) * 0.24;
    cy += (y - cy) * 0.24;
    root.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function magnetic() {
  for (const el of document.querySelectorAll<HTMLElement>("[data-magnetic]")) {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      animate(el, { x: dx * 0.22, y: dy * 0.3 }, { type: "spring", stiffness: 260, damping: 18, mass: 0.6 });
    });
    el.addEventListener("pointerleave", () => {
      animate(el, { x: 0, y: 0 }, { type: "spring", bounce: 0.35, visualDuration: 0.5 });
    });
  }
}

/** Desktop and phone build different particle scenes; rebuild the page when a resize crosses between them. */
function reloadAcrossBreakpoint() {
  const wide = matchMedia("(min-width: 1001px)");
  let timer = 0;
  wide.addEventListener("change", () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => location.reload(), 250);
  });
}
