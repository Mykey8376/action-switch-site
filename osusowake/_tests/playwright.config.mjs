import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const built = process.env.TEST_BUILT === '1';
const directory = built ? fileURLToPath(new URL('./build', import.meta.url)) : fileURLToPath(new URL('../../../', import.meta.url));
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.mjs',
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173/action-switch-site/',
    trace: 'off',
    screenshot: 'off',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {},
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: `python3 -m http.server 4173 --bind 127.0.0.1 --directory "${directory}"`,
    cwd: repo,
    url: 'http://127.0.0.1:4173/action-switch-site/',
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'ignore',
  },
});
