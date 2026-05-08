import assert from "node:assert/strict";
import {
  normalizeAspectLabels,
  slugifyDirectoryName,
  validateDirectorySubmission,
} from "./directory-submissions";

assert.equal(slugifyDirectoryName("AI Design Tools!"), "ai-design-tools");
assert.equal(slugifyDirectoryName("  Databases & Queues  "), "databases-queues");

assert.deepEqual(
  normalizeAspectLabels(["Cost", " cost ", "", "Developer Experience"]),
  ["Cost", "Developer Experience"],
);

assert.equal(
  validateDirectorySubmission({
    name: "AI design tools",
    description: "Design agents and creative tools for app builders.",
    heroCopy: "Compare quality, cost, reliability, and workflow fit.",
    aspectLabels: ["Quality", "Cost", "Reliability"],
  }).ok,
  true,
);

const invalid = validateDirectorySubmission({
  name: "AI",
  description: "Too short",
  heroCopy: "Also too short",
  aspectLabels: ["Cost"],
});
assert.equal(invalid.ok, false);
