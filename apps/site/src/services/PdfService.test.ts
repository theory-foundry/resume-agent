import assert from "node:assert/strict";
import test from "node:test";

import PdfService from "./PdfService.js";

test("generates a non-empty resume PDF without undefined contact content", async () => {
  const blob = await new PdfService().generateResumePdf();
  assert.equal(blob.type, "application/pdf");
  assert.ok(blob.size > 1_000);
  const content = Buffer.from(await blob.arrayBuffer()).toString("latin1");
  assert.doesNotMatch(content, /\bundefined\b/);
});
