import assert from "node:assert/strict";
import test from "node:test";

import {
  assertValidAssistantConfig,
  assertValidSiteConfig,
  assistantConfig,
  siteConfig,
} from "./product-config.js";

test("example site and assistant configuration is valid", () => {
  assert.doesNotThrow(() => assertValidSiteConfig(siteConfig));
  assert.doesNotThrow(() => assertValidAssistantConfig(assistantConfig));
});

test("site and assistant configuration reject incomplete customization", () => {
  assert.throws(
    () => assertValidSiteConfig({ ...siteConfig, navigation: [] }),
    /navigation/,
  );
  assert.throws(
    () => assertValidAssistantConfig({ ...assistantConfig, suggestions: [] }),
    /suggestions/,
  );
});
