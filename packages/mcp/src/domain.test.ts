import assert from "node:assert/strict";
import test from "node:test";

import { exampleProfile } from "@resume-agent/profile";

import { createResumeDomain } from "./domain.js";

test("resume domain searches all supported profile sections", () => {
  const domain = createResumeDomain(exampleProfile);

  assert.deepEqual(
    domain.search("accessibility").map((match) => match.type),
    ["skill"],
  );
  assert.equal(domain.search("feedback loops")[0]?.id, "building-reliable-products");
  assert.equal(domain.search("distributed teams")[0]?.type, "experience");
  assert.equal(domain.search("TEAM WORKSPACE")[0]?.id, "team-workspace");
});

test("resume domain returns bounded exact and filtered records", () => {
  const domain = createResumeDomain(exampleProfile);

  assert.equal(domain.getExperience("senior")[0]?.company, "Example Studio");
  assert.equal(domain.getProject("TEAM-WORKSPACE")?.title, "Team Workspace");
  assert.equal(
    domain.getArticle("building-reliable-products")?.publishedAt,
    "2025-01-15",
  );
  assert.equal(domain.getProject("missing"), undefined);
  assert.equal(domain.getContact().email, "alex@example.com");
});

test("resume domain validates profiles at its boundary", () => {
  assert.throws(
    () => createResumeDomain({}),
    /Invalid resume profile/,
  );
});
