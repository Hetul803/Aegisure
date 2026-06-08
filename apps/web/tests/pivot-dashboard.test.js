import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const appRoot = path.resolve(process.cwd(), 'app');

describe('pivot dashboard scaffold', () => {
  it('defines the required dashboard pages', () => {
    const required = [
      'page.tsx',
      'dashboard/page.tsx',
      'onboarding/page.tsx',
      'repos/page.tsx',
      'repos/[id]/constitution/page.tsx',
      'memory-export/page.tsx',
      'attribution/page.tsx',
      'provenance/page.tsx',
      'policies/page.tsx',
      'audit/page.tsx',
      'settings/page.tsx',
      'docs/page.tsx',
      'pricing/page.tsx',
    ];
    for (const file of required) {
      expect(fs.existsSync(path.join(appRoot, file))).toBe(true);
    }
  });

  it('landing page names the pivot promise', () => {
    const page = fs.readFileSync(path.join(appRoot, 'page.tsx'), 'utf-8');
    expect(page).toContain('One constitution. Every agent. Safer commits.');
    expect(page).toContain('see, govern, and remember everything every agent does');
    expect(page).toContain('pip install aegisure');
    expect(page).toContain('No card collection');
    expect(page).toContain('href="/docs"');
    expect(page).toContain('href="/pricing"');
  });
});
