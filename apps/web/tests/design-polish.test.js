import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

describe('polished launch UI', () => {
  it('uses a layered theme instead of a pure-black default', () => {
    const css = fs.readFileSync(path.resolve(root, 'app/globals.css'), 'utf-8');
    expect(css).toContain('.dark');
    expect(css).toContain('--accent');
    expect(css).toContain('--background: 240 10% 4%');
    expect(css).toContain('--card: 240 8% 9%');
    expect(css).toContain('.elevated-surface');
    expect(css).not.toContain('--background: 0 0% 0%');
  });

  it('has a persistent theme toggle in the app shell', () => {
    const shell = fs.readFileSync(path.resolve(root, 'components/ui.tsx'), 'utf-8');
    const toggle = fs.readFileSync(path.resolve(root, 'components/theme-toggle.tsx'), 'utf-8');
    expect(shell).toContain('ThemeToggle');
    expect(shell).toContain('AuthActions');
    expect(shell).not.toContain('SignOutButton');
    expect(toggle).toContain('aegisure-theme');
    expect(toggle).toContain('document.documentElement.classList.toggle');
  });

  it('renders exclusive signed-in and signed-out dashboard auth states', () => {
    const actions = fs.readFileSync(path.resolve(root, 'components/auth-actions.tsx'), 'utf-8');
    expect(actions).toContain('aegisure_token=');
    expect(actions).toContain('Sign in with GitHub');
    expect(actions).toContain('SignOutButton');
    expect(actions).toContain('if (signedIn)');
  });

  it('defines the guided first-run onboarding path', () => {
    const onboarding = fs.readFileSync(path.resolve(root, 'components/onboarding-flow.tsx'), 'utf-8');
    expect(onboarding).toContain('Install the GitHub App');
    expect(onboarding).toContain('Generate Aegisure.md');
    expect(onboarding).toContain('Pick repositories');
    expect(onboarding).toContain('Land on dashboard');
  });

  it('surfaces BYOK management from settings', () => {
    const settings = fs.readFileSync(path.resolve(root, 'app/settings/page.tsx'), 'utf-8');
    const form = fs.readFileSync(path.resolve(root, 'components/byok-form.tsx'), 'utf-8');
    expect(settings).toContain('ByokForm');
    expect(form).toContain('/settings/llm-key');
    expect(form).toContain('Anthropic');
    expect(form).toContain('OpenAI');
  });

  it('uses a product-demo terminal hero with copyable CLI CTA', () => {
    const page = fs.readFileSync(path.resolve(root, 'app/page.tsx'), 'utf-8');
    const terminal = fs.readFileSync(path.resolve(root, 'components/faux-terminal.tsx'), 'utf-8');
    const install = fs.readFileSync(path.resolve(root, 'components/install-command.tsx'), 'utf-8');
    expect(page).toContain('FauxTerminal');
    expect(terminal).toContain('$ aegisure init');
    expect(terminal).toContain('Generated Aegisure.md');
    expect(terminal).toContain('$ aegisure scan --staged');
    expect(terminal).toContain('Aegisure verdict: block (100/100)');
    expect(terminal).toContain('CRITICAL secret_in_diff at app.py:1');
    expect(terminal).toContain('$ aegisure repair --staged');
    expect(terminal).toContain('$ aegisure doctor');
    expect(terminal).toContain('whitespace-pre-wrap break-words');
    expect(terminal).toContain('prefers-reduced-motion: reduce');
    expect(install).toContain('navigator.clipboard.writeText');
  });

  it('adds public docs and pricing routes without commerce language', () => {
    const docs = fs.readFileSync(path.resolve(root, 'app/docs/page.tsx'), 'utf-8');
    const pricing = fs.readFileSync(path.resolve(root, 'app/pricing/page.tsx'), 'utf-8');
    expect(docs).toContain('aegisure init');
    expect(docs).toContain('aegisure rewind last');
    expect(docs).toContain('aegisure login');
    expect(docs).toContain('lg:grid-cols-[14rem_minmax(0,1fr)_minmax(18rem,0.9fr)]');
    expect(docs).toContain('md:col-start-2 lg:col-start-auto');
    expect(pricing).toContain('Free during beta');
    expect(pricing).toContain('no checkout');
    expect(pricing).not.toMatch(/\$\d/);
    expect(pricing).not.toMatch(/Stripe|pre-order|payment integration/i);
  });

  it('has an interactive grounded audit chatbot surface', () => {
    const panel = fs.readFileSync(path.resolve(root, 'components/audit-chat-panel.tsx'), 'utf-8');
    expect(panel).toContain('what did Codex change today?');
    expect(panel).toContain('which agent touched auth this week?');
    expect(panel).toContain('show risky PRs still open.');
    expect(panel).toContain('Add a BYOK key in Settings');
    expect(panel).toContain('findGroundedRecords');
  });
});
