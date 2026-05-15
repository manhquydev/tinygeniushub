import { test, expect, type Page } from "@playwright/test";
import path from "path";
import fs from "fs";

// Ensure screenshot directory exists
const SCREENSHOT_DIR = path.join(process.cwd(), "test-results", "interactive-lesson-screenshots");

function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

async function screenshot(page: Page, name: string) {
  ensureScreenshotDir();
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

// Open the lesson from the selector page and wait for Hook step
async function openLesson(page: Page) {
  await page.goto("/interactive-lesson-preview");
  const startBtn = page.getByRole("button", { name: "Start: Sounds /a/ and /m/" });
  await expect(startBtn).toBeVisible({ timeout: 5000 });
  await startBtn.click();
  // Hook step: speech bubble "Hello child!" should appear
  await expect(page.getByText("Hello child!")).toBeVisible({ timeout: 8000 });
}

// Advance from Hook to Concept step.
// The hook step auto-advances after audio error (2s) + autoAdvanceMs (2.5s) = ~4.5s.
// We click "Begin" if still present, otherwise wait for auto-advance.
async function advanceFromHookToConcept(page: Page) {
  const conceptIndicator = page.getByText(/Phat am:/);
  const batDauBtn = page.getByRole("button", { name: "Begin", exact: true });

  // Try to click "Begin" quickly — if it detaches (auto-advance already fired), that's fine
  try {
    await batDauBtn.click({ timeout: 3000 });
  } catch {
    // Button already gone — auto-advance fired, concept step loading
  }

  // Wait for concept step (identified by subtext unique to concept)
  await expect(conceptIndicator).toBeVisible({ timeout: 12000 });
}

// Navigate to Concept step
async function navigateToConcept(page: Page) {
  await openLesson(page);
  await advanceFromHookToConcept(page);
}

// Navigate to Demonstrate step
// Concept step: no autoAdvanceMs, waits for "Continue" after audio ends
// Audio mock returns empty 200 → audio errors → 2s fallback → onEnd → canAdvance=true → "Continue" shown after 500ms
async function navigateToDemonstrate(page: Page) {
  await navigateToConcept(page);

  // Wait for "Continue" button (concept step, no auto-advance)
  const tiepTucBtn = page.getByRole("button", { name: "Continue", exact: true });
  await tiepTucBtn.waitFor({ timeout: 10000 });
  await tiepTucBtn.click();

  // Demonstrate step: concept subtext should be gone, we're in demonstrate phase now
  // Wait for the first keyword card "ant" to appear (after intro audio errors ~2s)
  await expect(page.getByText("ant").first()).toBeVisible({ timeout: 12000 });
}

// Navigate to Activity step
// Demonstrate: intro audio errors → 2s → handleIntroEnd → keywords phase
// Per-keyword audio errors → 2s each → 3 keywords = ~6s more → done → "Continue"
async function navigateToActivity(page: Page) {
  await navigateToDemonstrate(page);

  // Wait for all keyword cards to be revealed and "Continue" to appear
  // Total expected: 2s per keyword x 3 = ~6s from demonstrate start
  await expect(page.getByText("apple").first()).toBeVisible({ timeout: 14000 });
  await expect(page.getByText("map").first()).toBeVisible({ timeout: 18000 });

  const tiepTucBtn = page.getByRole("button", { name: "Continue", exact: true });
  await tiepTucBtn.waitFor({ timeout: 10000 });
  await tiepTucBtn.click();

  // Activity step: quiz prompt "Which word has the /a/ sound?" rendered by ActivityRenderer
  await expect(page.getByText(/Tu nao co am/)).toBeVisible({ timeout: 10000 });
}

// Navigate to Celebrate step (answer quiz correctly)
async function navigateToCelebrate(page: Page) {
  await navigateToActivity(page);
  // "apple" is the correct answer (index 0)
  await expect(page.getByText("apple").first()).toBeVisible({ timeout: 8000 });
  await page.getByText("apple").first().click();
  await expect(page.getByText("Very good!")).toBeVisible({ timeout: 8000 });
}

test.describe("Interactive Lesson Preview — Sounds /a/ and /m/", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept audio files — return empty body to force quick error fallback in AudioPlayer
    await page.route("**/audio/**/*.mp3", (route) => route.fulfill({ status: 200, body: "" }));
  });

  // ── Selector page ──────────────────────────────────────────────────────────

  test("01 | page loads with lesson selector heading", async ({ page }) => {
    await page.goto("/interactive-lesson-preview");
    await expect(page.getByRole("heading", { name: /Interactive Lesson Preview/i })).toBeVisible();
    await screenshot(page, "01-page-loaded");
  });

  test("02 | first lesson 'Sounds /a/ and /m/' selected by default with ▶ indicator", async ({ page }) => {
    await page.goto("/interactive-lesson-preview");
    await expect(page.getByRole("button", { name: /▶ Am \/a\/ va \/m\// })).toBeVisible();
    await screenshot(page, "02-first-lesson-selected");
  });

  // ── Hook step ──────────────────────────────────────────────────────────────

  test("03 | clicking start opens lesson flow with Hook speech bubble 'Hello!'", async ({ page }) => {
    await openLesson(page);
    await expect(page.getByText("Hello child!")).toBeVisible();
    await screenshot(page, "03-hook-speech-bubble");
  });

  test("04 | hook step: pulsing 'Start' button visible", async ({ page }) => {
    await openLesson(page);
    await expect(page.getByRole("button", { name: "Begin", exact: true })).toBeVisible({ timeout: 5000 });
    await screenshot(page, "04-hook-batdau-button");
  });

  test("05 | hook step: lesson title visible in header bar", async ({ page }) => {
    await openLesson(page);
    await expect(page.getByText("Sounds /a/ and /m/").first()).toBeVisible();
    await screenshot(page, "05-hook-header-title");
  });

  // ── Concept step ───────────────────────────────────────────────────────────

  test("06 | concept step: keyword display with subtext appears", async ({ page }) => {
    await navigateToConcept(page);
    await expect(page.getByText(/Phat am:/)).toBeVisible();
    await screenshot(page, "06-concept-subtext");
  });

  test("07 | concept step: speaker replay button (title='Listen again') visible", async ({ page }) => {
    await navigateToConcept(page);
    // The speaker button has title="Listen again" and is rendered when step.audioUrl is set
    await expect(page.getByTitle("Listen again")).toBeVisible({ timeout: 8000 });
    await screenshot(page, "07-concept-speaker-button");
  });

  test("08 | concept step: speech bubble 'This is the A sound' visible", async ({ page }) => {
    await navigateToConcept(page);
    // Speech bubble renders text inside a <span> with role="status" on parent
    await expect(page.getByText("This is the A sound")).toBeVisible({ timeout: 8000 });
    await screenshot(page, "08-concept-speech-bubble");
  });

  // ── Demonstrate step ───────────────────────────────────────────────────────

  test("09 | demonstrate step: first keyword card 'ant' appears after transition", async ({ page }) => {
    await navigateToDemonstrate(page);
    // navigateToDemonstrate already waits for "ant" — verify it stays visible
    await expect(page.getByText("ant").first()).toBeVisible();
    await screenshot(page, "09-demonstrate-first-card");
  });

  test("10 | demonstrate step: first keyword card 'ant' appears", async ({ page }) => {
    await navigateToDemonstrate(page);
    // First keyword card appears when intro audio ends + keywords phase starts
    await expect(page.getByText("ant").first()).toBeVisible({ timeout: 10000 });
    await screenshot(page, "10-demonstrate-ant-card");
  });

  test("11 | demonstrate step: all keyword cards appear (ant, apple, map)", async ({ page }) => {
    await navigateToDemonstrate(page);
    // All 3 keyword cards revealed sequentially (each with 2s audio error fallback)
    await expect(page.getByText("ant").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("apple").first()).toBeVisible({ timeout: 14000 });
    await expect(page.getByText("map").first()).toBeVisible({ timeout: 18000 });
    await screenshot(page, "11-demonstrate-all-cards");
  });

  // ── Activity step ──────────────────────────────────────────────────────────

  test("12 | activity step: quiz prompt 'Which word has the /a/ sound?' visible. visible", async ({ page }) => {
    await navigateToActivity(page);
    await expect(page.getByText(/Tu nao co am/)).toBeVisible();
    await screenshot(page, "12-activity-quiz-prompt");
  });

  test("13 | activity step: all quiz options visible (apple, egg, ice, owl)", async ({ page }) => {
    await navigateToActivity(page);
    await expect(page.getByText("apple").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("egg").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("ice").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("owl").first()).toBeVisible({ timeout: 5000 });
    await screenshot(page, "13-activity-all-options");
  });

  // ── Celebrate step ─────────────────────────────────────────────────────────

  test("14 | correct answer 'apple' advances to celebrate with 'Good job!'", async ({ page }) => {
    await navigateToCelebrate(page);
    await expect(page.getByText("Very good!")).toBeVisible();
    await screenshot(page, "14-celebrate-speech-bubble");
  });

  test("15 | celebrate step: 'Continue now...' progress hint visible", async ({ page }) => {
    await navigateToCelebrate(page);
    await expect(page.getByText("Continue now...")).toBeVisible({ timeout: 6000 });
    await screenshot(page, "15-celebrate-progress-hint");
  });

  test("16 | full lesson flow completes without critical JS errors", async ({ page }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await navigateToCelebrate(page);
    await screenshot(page, "16-full-flow-complete");

    // Filter known non-critical audio autoplay errors
    const criticalErrors = jsErrors.filter(
      (e) =>
        !e.includes("play()") &&
        !e.includes("autoplay") &&
        !e.includes("AbortError") &&
        !e.includes("The play() request was interrupted")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
