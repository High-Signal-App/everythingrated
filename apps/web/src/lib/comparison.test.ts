import assert from 'node:assert/strict';

import { test } from 'vitest';

import { compareItems, encodeCompareState, parseCompareState } from './comparison';
import type { ItemWithAggregate } from './ratings';

test('comparison', () => {
  const aspect = (key: string, label = key) => ({
    id: key,
    directoryId: 'dir',
    key,
    label,
    description: '',
    sortOrder: 0,
  });

  const item = (id: string, name: string, scores: Record<string, number>): ItemWithAggregate => ({
    item: {
      id,
      directoryId: 'dir',
      slug: id,
      name,
      description: '',
      websiteUrl: '',
      logoUrl: null,
      createdAt: new Date(0),
    },
    aspects: Object.entries(scores).map(([key, avg]) => ({
      aspect: aspect(key),
      avg,
      count: 3,
      yourScore: null,
    })),
    overall: 0,
    totalRaters: 3,
  });

  const rows = compareItems(
    [item('a', 'A', { speed: 5, polish: 2 }), item('b', 'B', { speed: 2, polish: 5 })],
    ['a', 'b'],
    { polish: 4, speed: 1 }
  );

  assert.equal(rows[0].item.id, 'b');
  assert.equal(rows[0].total! > rows[1].total!, true);

  // A missing axis must not drag a rated score down, and evidence survives ranking.
  const sparse = item('sparse', 'Sparse', { speed: 4, polish: 0 });
  sparse.aspects[1].count = 0;
  sparse.totalRaters = 1;
  const sparseRows = compareItems([sparse], ['sparse'], {});
  assert.equal(sparseRows[0].total, 4);
  assert.equal(sparseRows[0].totalRaters, 1);
  assert.equal(sparseRows[0].tradeoffs[1].count, 0);
  assert.equal(compareItems([sparse], ['sparse'], { speed: 0 })[0].total, null);
  assert.equal(compareItems([sparse], ['sparse'], { speed: 0, polish: 0 })[0].total, null);
  const unrated = item('unrated', 'Unrated', { speed: 0 });
  unrated.aspects[0].count = 0;
  const mixed = compareItems([unrated, sparse], ['unrated', 'sparse'], {});
  assert.equal(mixed[0].item.id, 'sparse');
  assert.equal(mixed[1].total, null);

  const encoded = encodeCompareState(['a', 'b'], { speed: 1, polish: 2.5 });
  const parsed = parseCompareState(new URLSearchParams(encoded));
  assert.deepEqual(parsed.selectedIds, ['a', 'b']);
  assert.equal(parsed.weights.polish, 2.5);
  assert.equal(parsed.weights.speed, undefined);

  // Weight of 0 zeroes that aspect's contribution.
  const zeroWeight = compareItems(
    [item('a', 'A', { speed: 5, polish: 5 }), item('b', 'B', { speed: 5, polish: 0 })],
    ['a', 'b'],
    { speed: 0, polish: 1 }
  );
  assert.equal(zeroWeight[0].item.id, 'a');
  assert.equal(zeroWeight[0].total, 5);
  assert.equal(zeroWeight[1].total, 0);

  // Weights above 5 should clamp; weights below 0 should clamp to 0.
  const clampedEncoded = encodeCompareState(['a'], { speed: 99, polish: -2 });
  const clampedParsed = parseCompareState(new URLSearchParams(clampedEncoded));
  assert.equal(clampedParsed.weights.speed, 5);
  assert.equal(clampedParsed.weights.polish, 0);

  // More than 4 selected IDs should truncate to the first 4.
  const truncated = parseCompareState(new URLSearchParams('compare=a,b,c,d,e,f,g'));
  assert.deepEqual(truncated.selectedIds, ['a', 'b', 'c', 'd']);

  // Selecting an unknown id should drop it rather than throw.
  const unknown = compareItems([item('a', 'A', { speed: 4 })], ['a', 'missing'], {});
  assert.equal(unknown.length, 1);
  assert.equal(unknown[0].item.id, 'a');

  // Equal totals sort alphabetically.
  const tied = compareItems(
    [item('z', 'Zeta', { speed: 4 }), item('a', 'Alpha', { speed: 4 })],
    ['z', 'a'],
    {}
  );
  assert.equal(tied[0].item.name, 'Alpha');

  // Empty weight string should not pollute the parsed map.
  const noWeights = parseCompareState(new URLSearchParams('compare=a,b'));
  assert.deepEqual(noWeights.weights, {});
});
