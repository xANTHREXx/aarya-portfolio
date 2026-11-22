import test from "node:test";
import assert from "node:assert/strict";

import { getCase } from "../src/data/cases.ts";
import { ORDER, read, text, section } from "./helpers.mjs";

for (const slug of ORDER) {
  test(`core specs for ${slug}`, () => {
    const c = getCase(slug);
    assert.ok(c, `Case study not found for ${slug}`);
    const h = read(slug);
    const t = text(h);

    // text(h) contains c.title, c.lead, every c.problem paragraph, every flow step title and detail,
    // every fact value and label, and every meta value.
    assert.ok(t.includes(c.title), `text(h) missing title: ${c.title}`);
    assert.ok(t.includes(c.lead), `text(h) missing lead: ${c.lead}`);
    for (const p of c.problem) {
      assert.ok(t.includes(p), `text(h) missing problem paragraph: ${p}`);
    }
    for (const step of c.flow) {
      assert.ok(t.includes(step.title), `text(h) missing flow step title: ${step.title}`);
      assert.ok(t.includes(step.detail), `text(h) missing flow step detail: ${step.detail}`);
    }
    for (const fact of c.facts) {
      assert.ok(t.includes(fact.value), `text(h) missing fact value: ${fact.value}`);
      assert.ok(t.includes(fact.label), `text(h) missing fact label: ${fact.label}`);
    }
    for (const m of c.meta) {
      assert.ok(t.includes(m.value), `text(h) missing meta value: ${m.value}`);
    }

    // h contains an <h1 whose text equals c.title
    const h1Match = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(h);
    assert.ok(h1Match, "page contains an <h1> element");
    assert.equal(text(h1Match[1]), c.title, "<h1> text equals c.title");

    // section(h, "problem"), section(h, "flow") and section(h, "facts") are all non-null
    assert.ok(section(h, "problem") !== null, 'section(h, "problem") must be non-null');
    assert.ok(section(h, "flow") !== null, 'section(h, "flow") must be non-null');
    assert.ok(section(h, "facts") !== null, 'section(h, "facts") must be non-null');

    // h contains href="/#work"
    assert.ok(h.includes('href="/#work"'), 'h contains href="/#work"');

    // The next-project link: the element with attribute data-next-case has href="/work/<next>/"
    // where <next> is the following slug in ORDER, wrapping from the last to the first;
    // its text contains that case's title.
    const currentIndex = ORDER.indexOf(slug);
    const nextSlug = ORDER[(currentIndex + 1) % ORDER.length];
    const nextCase = getCase(nextSlug);

    const nextTagMatch = /<([a-zA-Z0-9:-]+)\b[^>]*?\bdata-next-case\b[^>]*>([\s\S]*?)<\/\1>/i.exec(h);
    assert.ok(nextTagMatch, "element with attribute data-next-case exists");
    const nextElemHtml = nextTagMatch[0];
    const nextInnerHtml = nextTagMatch[2];
    assert.ok(
      nextElemHtml.includes(`href="/work/${nextSlug}/"`) || nextElemHtml.includes(`href='/work/${nextSlug}/'`),
      `data-next-case element href must equal /work/${nextSlug}/`
    );
    assert.ok(
      text(nextInnerHtml).includes(nextCase.title),
      `data-next-case text must contain next case title: ${nextCase.title}`
    );

    // text(h) does not contain being written
    assert.ok(!t.includes("being written"), "text(h) must not contain 'being written'");

    // Every link in c.links appears as an href in h
    for (const link of c.links) {
      assert.ok(
        h.includes(`href="${link.href}"`) || h.includes(`href='${link.href}'`),
        `h must contain href for link: ${link.href}`
      );
    }
  });
}
