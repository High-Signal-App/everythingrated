import { test } from 'vitest';
import assert from "node:assert/strict";
import {
  isDomainAligned,
  isUrlPlausible,
  normalizeItemName,
  normalizeWebsiteUrl,
  parseWebsiteHost,
  slugifyItemName,
  validateItemSubmission,
} from "./item-submissions";

test('item-submissions', () => {
  
  
  assert.equal(slugifyItemName("Cursor IDE!"), "cursor-ide");
  assert.equal(slugifyItemName("  Zed Editor  "), "zed-editor");
  assert.equal(slugifyItemName("---"), "");
  assert.equal(slugifyItemName("a".repeat(120)).length, 60);
  
  assert.equal(normalizeItemName("Cursor IDE"), "cursor ide");
  assert.equal(normalizeItemName("  Continue — Dev  "), "continue dev");
  
  assert.equal(normalizeWebsiteUrl("https://zed.dev/"), "https://zed.dev");
  assert.equal(normalizeWebsiteUrl("zed.dev"), "https://zed.dev");
  assert.equal(normalizeWebsiteUrl("http://zed.dev"), null);
  assert.equal(normalizeWebsiteUrl("not a url"), null);
  
  assert.equal(parseWebsiteHost("https://www.cursor.com/docs"), "cursor.com");
  assert.equal(parseWebsiteHost("https://continue.dev"), "continue.dev");
  
  assert.equal(isUrlPlausible("https://zed.dev"), true);
  assert.equal(isUrlPlausible("https://example.invalid"), false);
  
  assert.equal(isDomainAligned("Zed", "https://zed.dev"), true);
  assert.equal(isDomainAligned("Totally Real AI", "https://example.invalid"), false);
  
  assert.equal(
    validateItemSubmission({
      directorySlug: "ai-dev-tools",
      name: "Zed",
      description: "High-performance multiplayer code editor from the Atom team.",
      websiteUrl: "https://zed.dev",
    }).ok,
    true,
  );
  
  const shortDesc = validateItemSubmission({
    directorySlug: "ai-dev-tools",
    name: "Zed",
    description: "Too short",
    websiteUrl: "https://zed.dev",
  });
  assert.equal(shortDesc.ok, false);
  
  const wrongDir = validateItemSubmission({
    directorySlug: "databases",
    name: "Zed",
    description: "High-performance multiplayer code editor from the Atom team.",
    websiteUrl: "https://zed.dev",
  });
  assert.equal(wrongDir.ok, false);
  
  const badEmail = validateItemSubmission({
    directorySlug: "ai-dev-tools",
    name: "Zed",
    description: "High-performance multiplayer code editor from the Atom team.",
    websiteUrl: "https://zed.dev",
    submitterEmail: "not-an-email",
  });
  assert.equal(badEmail.ok, false);
  
  console.log("item-submissions.test.ts: all assertions passed");
});
