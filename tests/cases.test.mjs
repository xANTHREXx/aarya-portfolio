import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { cases, getCase } from "../src/data/cases.ts";
import { work } from "../src/data/site.ts";
import { ORDER } from "./helpers.mjs";

test("cases has exactly 4 entries matching work slugs and ORDER", () => {
  assert.equal(cases.length, 4);
  const caseSlugs = cases.map((c) => c.slug);
  const workSlugs = work.map((w) => w.slug);
  assert.deepEqual(caseSlugs, workSlugs);
  assert.deepEqual(caseSlugs, ORDER);
});

test("every case has valid required fields and flow steps", () => {
  for (const c of cases) {
    assert.ok(typeof c.title === "string" && c.title.trim().length > 0, `empty title in ${c.slug}`);
    assert.ok(typeof c.lead === "string" && c.lead.trim().length > 0, `empty lead in ${c.slug}`);
    assert.ok(Array.isArray(c.problem) && c.problem.length >= 1, `problem must have >= 1 paragraph in ${c.slug}`);
    for (const p of c.problem) {
      assert.ok(typeof p === "string" && p.trim().length > 0, `empty problem paragraph in ${c.slug}`);
    }
    assert.ok(Array.isArray(c.flow) && c.flow.length >= 3, `flow must have >= 3 steps in ${c.slug}`);
    for (const step of c.flow) {
      assert.ok(typeof step.where === "string" && step.where.trim().length > 0, `empty flow.where in ${c.slug}`);
      assert.ok(typeof step.title === "string" && step.title.trim().length > 0, `empty flow.title in ${c.slug}`);
      assert.ok(typeof step.detail === "string" && step.detail.trim().length > 0, `empty flow.detail in ${c.slug}`);
    }
    assert.ok(Array.isArray(c.facts) && c.facts.length >= 1, `facts must have >= 1 entry in ${c.slug}`);
    for (const fact of c.facts) {
      assert.ok(typeof fact.value === "string" && fact.value.trim().length > 0, `empty fact.value in ${c.slug}`);
      assert.ok(typeof fact.label === "string" && fact.label.trim().length > 0, `empty fact.label in ${c.slug}`);
    }
  }
});

test("shots and shippingShot files exist under public/", () => {
  for (const c of cases) {
    if (Array.isArray(c.shots)) {
      for (const shot of c.shots) {
        const relPath = shot.src.replace(/^\/+/, "");
        const fullPath = path.resolve(import.meta.dirname, "..", "public", relPath);
        assert.ok(fs.existsSync(fullPath), `missing image file: ${fullPath} for ${c.slug}`);
      }
    }
    if (c.shippingShot && c.shippingShot.src) {
      const relPath = c.shippingShot.src.replace(/^\/+/, "");
      const fullPath = path.resolve(import.meta.dirname, "..", "public", relPath);
      assert.ok(fs.existsSync(fullPath), `missing shippingShot file: ${fullPath} for ${c.slug}`);
    }
  }
});

test("clearbill factsNote contains separate", () => {
  const cb = getCase("clearbill");
  assert.ok(cb && cb.factsNote && cb.factsNote.includes("separate"));
});

test("getCase retrieves case by slug or undefined", () => {
  assert.equal(getCase("taxi-pipeline")?.title, "Taxi data pipeline");
  assert.equal(getCase("nope"), undefined);
});

test("no string anywhere in cases contains @ or a run of 10 or more digits", () => {
  function walk(val, key = "") {
    if (typeof val === "string") {
      if (key === "code") {
        // Snippets legitimately contain Python decorators (@dag) and Airflow presets (@daily);
        // ensure no email addresses or phone numbers/runs of 10+ digits leak in code.
        assert.doesNotMatch(val, /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
        assert.doesNotMatch(val, /\d{10,}/);
      } else {
        assert.ok(!val.includes("@"), `String contains @: ${val}`);
        assert.doesNotMatch(val, /\d{10,}/, `String contains 10+ digits: ${val}`);
      }
    } else if (Array.isArray(val)) {
      for (const item of val) {
        walk(item, key);
      }
    } else if (val && typeof val === "object") {
      for (const [k, v] of Object.entries(val)) {
        walk(v, k);
      }
    }
  }
  walk(cases);
});
