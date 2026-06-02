import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

describe('polished launch UI', () => {
  it('uses a layered theme instead of a pure-black default', () => {
    const css = fs.readFileSync(path.resolve(root, 'app/globals.css'), 'utf-8');
    expect(css).toContain('.dark');
    expect(css).toContain('--accent');
    expect(css).toContain('--background: 240 10% 6%');
    expect(css).not.toContain('--background: 0 0% 0%');
  });

  it('has a persistent theme toggle in the app shell', () => {
    const shell = fs.readFileSync(path.resolve(root, 'components/ui.tsx'), 'utf-8');
    const toggle = fs.readFileSync(path.resolve(root, 'components/theme-toggle.tsx'), 'utf-8');
    expect(shell).toContain('ThemeToggle');
    expect(toggle).toContain('aegisure-theme');
    expect(toggle).toContain('document.documentElement.classList.toggle');
  });

  it('defines the guided first-run onboarding path', () => {
    const onboarding = fs.readFileSync(path.resolve(root, 'components/onboarding-flow.tsx'), 'utf-8');
    expect(onboarding).toContain('Install the GitHub App');
    expect(onboarding).toContain('Generate AEGIS.md');
    expect(onboarding).toContain('Pick repositories');
  });

  it('surfaces BYOK management from settings', () => {
    const settings = fs.readFileSync(path.resolve(root, 'app/settings/page.tsx'), 'utf-8');
    const form = fs.readFileSync(path.resolve(root, 'components/byok-form.tsx'), 'utf-8');
    expect(settings).toContain('ByokForm');
    expect(form).toContain('/settings/llm-key');
    expect(form).toContain('Anthropic');
    expect(form).toContain('OpenAI');
  });
});
