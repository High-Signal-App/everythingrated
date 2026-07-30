import { describe, expect, it } from 'vitest';

import {
  PRIVATE_OR_CONTEXTUAL_PATHS,
  PUBLIC_COLLECTIONS,
  PUBLIC_DATA_RESOURCES,
  PUBLIC_STATIC_SURFACES,
  publicAgentCatalog,
} from './public-surfaces';

describe('public agent surfaces', () => {
  it('maps every canonical static HTML route to distinct Markdown', () => {
    expect(PUBLIC_STATIC_SURFACES.length).toBe(10);
    expect(new Set(PUBLIC_STATIC_SURFACES.map((surface) => surface.path)).size).toBe(10);
    expect(new Set(PUBLIC_STATIC_SURFACES.map((surface) => surface.markdownPath)).size).toBe(10);
    expect(PUBLIC_STATIC_SURFACES.every((surface) => surface.markdownPath.endsWith('.md'))).toBe(
      true
    );
  });

  it('keeps dynamic HTML collections paired with Markdown templates', () => {
    expect(PUBLIC_COLLECTIONS).toHaveLength(2);
    for (const collection of PUBLIC_COLLECTIONS) {
      expect(collection.urlTemplate).not.toContain('.json');
      expect(collection.markdownTemplate).toContain('.md');
    }
  });

  it('catalogs data separately and excludes contextual or private routes', () => {
    const catalog = publicAgentCatalog();
    expect(catalog.surfaces).toHaveLength(PUBLIC_STATIC_SURFACES.length);
    expect(catalog.collections).toHaveLength(PUBLIC_COLLECTIONS.length);
    expect(catalog.dataResources).toHaveLength(PUBLIC_DATA_RESOURCES.length);
    for (const excluded of PRIVATE_OR_CONTEXTUAL_PATHS) {
      expect(catalog.surfaces.some((surface) => surface.url.endsWith(excluded))).toBe(false);
    }
  });
});
