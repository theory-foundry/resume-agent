import assert from "node:assert/strict";
import test from "node:test";
import { exampleProfile, profileAsPlainText, validateProfile } from "./index.js";

test("generic example profile is valid and drives text grounding", () => {
  assert.deepEqual(validateProfile(exampleProfile), []);
  assert.match(profileAsPlainText(exampleProfile), /Alex Morgan/);
});

test("unsafe project links are rejected", () => {
  const profile = structuredClone(exampleProfile);
  profile.projects[0]!.links = [{ label: "unsafe", url: "javascript:alert(1)" }];
  assert.match(validateProfile(profile)[0]?.path ?? "", /links/);
});

test("reports malformed nested profile fields without throwing", () => {
  const profile = structuredClone(exampleProfile) as unknown as Record<string, unknown>;
  profile.experience = [{ company: "", highlights: "not-an-array" }];
  profile.projects = [{ id: "duplicate" }, { id: "duplicate" }];
  profile.articles = [{ id: "article", publishedAt: "not-a-date" }];
  const issues = validateProfile(profile);
  assert.ok(issues.some((issue) => issue.path === "experience.0.company"));
  assert.ok(issues.some((issue) => issue.path === "experience.0.highlights"));
  assert.ok(issues.some((issue) => issue.path === "projects.1.id" && issue.message === "Must be unique."));
  assert.ok(issues.some((issue) => issue.path === "articles.0.publishedAt"));
});
