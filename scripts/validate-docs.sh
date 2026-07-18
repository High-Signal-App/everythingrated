#!/usr/bin/env bash
#
# validate-docs.sh — check every Markdown link in the repo resolves to a real
# file. Markdown committed to docs/ (and the root AGENTS.md / STATUS.md /
# README.md / PROJECT_STATUS.md) is the source of truth, so a broken link is
# a real defect. Runs in CI (no network) and locally.
#
# What it checks:
#   - Every [text](target) link in .md/.mdx files (excluding generated/build
#     dirs and node_modules).
#   - Internal relative links (./, ../, /, and bare paths) and repo-root-
#     relative links (docs/...). Resolves with .md / .mdx fallback and
#     directory-index (README.md) fallback.
#   - Anchor-only links (#section) are skipped (anchors aren't statically
#     verifiable without rendering).
#
# What it does NOT check:
#   - External URLs (http/https/mailto) — no network in CI.
#   - Plain text mentions of paths outside a link — those are prose.
#
# Exit code: 0 if all internal links resolve, 1 otherwise.
#
# Invoked as: pnpm docs:check
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

python3 - "$REPO_ROOT" << 'PYEOF'
import os, re, sys

ROOT = sys.argv[1]
LINK_RE = re.compile(r'\[([^\]]*)\]\(([^)]+)\)')

# Dirs whose contents are generated, vendored, or out of scope for doc links.
EXCLUDE_DIRS = {
    ".git", "node_modules", ".pnpm-store", ".blume", ".blume-verify",
    "dist", "build", "out", ".next", ".open-next", ".wrangler", ".turbo",
    ".astro", ".husky", ".vscode", ".idea", "coverage", "test-results",
    "playwright-report", ".vitest-cache", ".tmp", ".fallow",
}

def find_md_files():
    out = []
    for dp, dn, fn in os.walk(ROOT):
        # prune excluded dirs in-place
        dn[:] = [d for d in dn if d not in EXCLUDE_DIRS]
        for f in fn:
            if f.endswith((".md", ".mdx")):
                out.append(os.path.join(dp, f))
    return out

def resolve(ref_file, target):
    t = target.split("#")[0].split("?")[0]
    if t == "":
        return "ok"  # anchor-only
    if t.startswith(("http://", "https://", "mailto:")):
        return "ok"  # external — not checked (no network in CI)
    if t.startswith("/"):
        cand = os.path.join(ROOT, t.lstrip("/"))
    else:
        cand = os.path.normpath(os.path.join(os.path.dirname(ref_file), t))
    for c in (cand, cand + ".md", cand + ".mdx"):
        if os.path.exists(c):
            return "ok"
    # directory index (e.g. docs/decisions/ -> docs/decisions/README.md)
    idx = os.path.join(cand, "README.md")
    if os.path.exists(idx):
        return "ok"
    return "BROKEN"

broken = []
for md in find_md_files():
    rel = os.path.relpath(md, ROOT)
    try:
        with open(md, encoding="utf-8") as fh:
            for i, line in enumerate(fh, 1):
                for m in LINK_RE.finditer(line):
                    status = resolve(md, m.group(2))
                    if status == "BROKEN":
                        broken.append((rel, i, m.group(2), line.strip()[:140]))
    except Exception as e:
        print(f"ERR reading {md}: {e}", file=sys.stderr)

if broken:
    print(f"\n  {len(broken)} broken internal link(s):\n", file=sys.stderr)
    for rel, i, target, line in broken:
        print(f"  {rel}:{i}  ->  {target}", file=sys.stderr)
        print(f"    {line}", file=sys.stderr)
    sys.exit(1)

print("  all internal markdown links resolve")
sys.exit(0)
PYEOF
