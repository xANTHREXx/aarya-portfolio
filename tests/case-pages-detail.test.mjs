import test from "node:test";
import assert from "node:assert/strict";

import { getCase } from "../src/data/cases.ts";
import { read, text, section, decode } from "./helpers.mjs";

/** The decoded <img> tag in `html` whose src is exactly `src`, or null. */
function imgTag(html, src) {
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = decode(m[0]);
    const s = tag.match(/\ssrc="([^"]*)"|\ssrc='([^']*)'/i);
    if (s && (s[1] ?? s[2]) === src) return tag;
  }
  return null;
}

/** The alt attribute of a decoded <img> tag. */
const altOf = (tag) => {
  const m = tag.match(/\salt="([^"]*)"|\salt='([^']*)'/i);
  return m ? (m[1] ?? m[2]) : undefined;
};

test("clearbill detail", () => {
  const c = getCase("clearbill");
  assert.ok(c);
  const h = read("clearbill");

  // clearbill: section(h, "shots") contains an <img for each of the 6 shot srcs with its alt text,
  // and every caption text.
  const shotsSec = section(h, "shots");
  assert.ok(shotsSec !== null, "clearbill shots section must exist");
  const shotsText = text(shotsSec);

  assert.equal(c.shots.length, 6, "clearbill must have 6 shots");
  for (const shot of c.shots) {
    const tag = imgTag(shotsSec, shot.src);
    assert.ok(tag, `shots section missing <img> with src ${shot.src}`);
    assert.equal(altOf(tag), shot.alt, `wrong alt on ${shot.src}`);
    assert.ok(shotsText.includes(shot.caption), `shots section missing caption: ${shot.caption}`);
  }

  // section(h, "decisions") text contains every decision title and body.
  const decisionsSec = section(h, "decisions");
  assert.ok(decisionsSec !== null, "clearbill decisions section must exist");
  const decisionsText = text(decisionsSec);
  for (const d of c.decisions) {
    assert.ok(decisionsText.includes(d.title), `decisions missing title: ${d.title}`);
    assert.ok(decisionsText.includes(d.body), `decisions missing body: ${d.body}`);
  }

  // section(h, "shipping") text contains every trigger and route, and an <img with src /img/gh-actions.jpg.
  const shippingSec = section(h, "shipping");
  assert.ok(shippingSec !== null, "clearbill shipping section must exist");
  const shippingText = text(shippingSec);
  for (const s of c.shipping) {
    assert.ok(shippingText.includes(s.trigger), `shipping missing trigger: ${s.trigger}`);
    assert.ok(shippingText.includes(s.route), `shipping missing route: ${s.route}`);
  }
  const gh = imgTag(shippingSec, "/img/gh-actions.jpg");
  assert.ok(gh, "shipping section must contain <img> with src /img/gh-actions.jpg");
  assert.equal(altOf(gh), c.shippingShot.alt);

  // section(h, "next") contains 4 <li elements whose texts equal the 4 next items.
  const nextSec = section(h, "next");
  assert.ok(nextSec !== null, "clearbill next section must exist");
  const liMatches = [...nextSec.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)];
  assert.equal(liMatches.length, 4, "section(h, 'next') must contain 4 <li> elements");
  const liTexts = liMatches.map((m) => text(m[1]));
  assert.deepEqual(liTexts, c.next);

  // text(h) contains c.closing.
  assert.ok(c.closing, "clearbill has closing");
  assert.ok(text(h).includes(c.closing), `text(h) must contain closing: ${c.closing}`);
});

test("taxi-pipeline detail", () => {
  const c = getCase("taxi-pipeline");
  assert.ok(c);
  const h = read("taxi-pipeline");

  // taxi-pipeline: section(h, "code") contains at least 5 <pre elements;
  // its text contains every snippet file, every snippet title, and the decoded code overwrite=True and {{ ref('stg_taxi_trips') }}.
  const codeSec = section(h, "code");
  assert.ok(codeSec !== null, "taxi-pipeline code section must exist");
  const preMatches = [...codeSec.matchAll(/<pre\b/gi)];
  assert.ok(preMatches.length >= 5, "section(h, 'code') contains at least 5 <pre elements");

  const codeText = text(codeSec);
  for (const snippet of c.snippets) {
    assert.ok(codeText.includes(snippet.file), `code section missing snippet file: ${snippet.file}`);
    assert.ok(codeText.includes(snippet.title), `code section missing snippet title: ${snippet.title}`);
  }
  assert.ok(codeText.includes("overwrite=True"), "code section text must contain overwrite=True");
  assert.ok(codeText.includes("{{ ref('stg_taxi_trips') }}"), "code section text must contain {{ ref('stg_taxi_trips') }}");

  // section(h, "shots") contains an <img with src /img/sf-loaded.png.
  const shotsSec = section(h, "shots");
  assert.ok(shotsSec !== null, "taxi-pipeline shots section must exist");
  const sf = imgTag(shotsSec, "/img/sf-loaded.png");
  assert.ok(sf, "shots section must contain <img> with src /img/sf-loaded.png");
  assert.equal(altOf(sf), c.shots[0].alt);
});

test("ibm-batch detail", () => {
  const h = read("ibm-batch");

  // ibm-batch: section(h, "shots"), section(h, "code"), section(h, "shipping") and section(h, "next")
  // are all null (empty sections are not rendered), and h contains no <pre.
  assert.equal(section(h, "shots"), null, 'section(h, "shots") must be null for ibm-batch');
  assert.equal(section(h, "code"), null, 'section(h, "code") must be null for ibm-batch');
  assert.equal(section(h, "shipping"), null, 'section(h, "shipping") must be null for ibm-batch');
  assert.equal(section(h, "next"), null, 'section(h, "next") must be null for ibm-batch');
  assert.ok(!h.includes("<pre"), "ibm-batch page must contain no <pre element");
});

test("fashion-recommender detail", () => {
  const h = read("fashion-recommender");

  // fashion-recommender: h contains no href starting with https://github.com/Aaryap1/ (a repo link).
  assert.ok(
    !/href=["']https:\/\/github\.com\/Aaryap1\//i.test(h),
    "fashion-recommender must contain no href starting with https://github.com/Aaryap1/"
  );

  // section(h, "decisions") is non-null.
  assert.ok(section(h, "decisions") !== null, 'section(h, "decisions") must be non-null for fashion-recommender');
});
