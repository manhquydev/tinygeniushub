import { test, expect } from "@playwright/test";

test.describe("Clarity Integration", () => {
  test.beforeEach(async ({ context }) => {
    // Clear all cookies and storage before each test
    await context.clearCookies();
  });

  test("script loads after consent accepted", async ({ page }) => {
    await page.goto("/");

    // Initially no Clarity script should be present
    await expect(page.locator("script#ccth-clarity-src")).not.toBeAttached();

    // Check clarity API not available initially
    const clarityBefore = await page.evaluate(() => (window as any).clarity);
    expect(clarityBefore).toBeUndefined();

    // Accept all cookies (includes analytics consent)
    await page.getByRole("button", { name: /chap nhan tat ca/i }).click();

    // Wait for page to reload after consent
    await page.waitForLoadState("networkidle");

    // Wait for script injection
    await page.waitForSelector("script#ccth-clarity-src", { timeout: 5000 });

    // Verify script is attached
    await expect(page.locator("script#ccth-clarity-src")).toBeAttached();

    // Verify script has correct attributes
    const script = page.locator("script#ccth-clarity-src");
    await expect(script).toHaveAttribute("async", "");
    const src = await script.getAttribute("src");
    expect(src).toContain("clarity.ms/tag/");
  });

  test("script does not load when only necessary cookies accepted", async ({ page }) => {
    await page.goto("/");

    // Initially no Clarity script
    await expect(page.locator("script#ccth-clarity-src")).not.toBeAttached();

    // Accept only necessary cookies
    await page.getByRole("button", { name: /chi cookie can thiet/i }).click();

    // Wait for page to reload
    await page.waitForLoadState("networkidle");

    // Wait a bit to ensure script doesn't load
    await page.waitForTimeout(1000);

    // Clarity should NOT be present
    await expect(page.locator("script#ccth-clarity-src")).not.toBeAttached();

    // Verify clarity API not available
    const clarity = await page.evaluate(() => (window as any).clarity);
    expect(clarity).toBeUndefined();
  });

  test("clarity API available on window after load", async ({ page }) => {
    await page.goto("/");

    // Accept all cookies
    await page.getByRole("button", { name: /chap nhan tat ca/i }).click();

    // Wait for page reload and script load
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("script#ccth-clarity-src", { timeout: 5000 });

    // Wait for clarity API to be initialized
    await page.waitForFunction(
      () => (window as any).clarity !== undefined,
      { timeout: 10000 }
    );

    // Verify clarity API has expected methods
    const clarityMethods = await page.evaluate(() => {
      const clarity = (window as any).clarity;
      return {
        hasEvent: typeof clarity?.event === "function",
        hasIdentify: typeof clarity?.identify === "function",
        hasSetTag: typeof clarity?.setTag === "function",
        hasUpgrade: typeof clarity?.upgrade === "function",
        hasConsent: typeof clarity?.consent === "function",
      };
    });

    expect(clarityMethods.hasEvent).toBe(true);
    expect(clarityMethods.hasIdentify).toBe(true);
    expect(clarityMethods.hasSetTag).toBe(true);
    expect(clarityMethods.hasUpgrade).toBe(true);
    expect(clarityMethods.hasConsent).toBe(true);
  });

  test("double consent does not create duplicate scripts", async ({ page }) => {
    await page.goto("/");

    // Accept all cookies
    await page.getByRole("button", { name: /chap nhan tat ca/i }).click();
    await page.waitForLoadState("networkidle");

    // Wait for initial script
    await page.waitForSelector("script#ccth-clarity-src", { timeout: 5000 });

    // Count scripts
    const scriptCountBefore = await page.locator("script#ccth-clarity-src").count();
    expect(scriptCountBefore).toBe(1);

    // Navigate to another page
    await page.goto("/courses");
    await page.waitForLoadState("networkidle");

    // Wait a moment for any potential double-loading
    await page.waitForTimeout(1000);

    // Verify only one script exists
    const scriptCountAfter = await page.locator("script#ccth-clarity-src").count();
    expect(scriptCountAfter).toBe(1);
  });

  test("clarity respects consent after page navigation", async ({ page }) => {
    // First visit with analytics consent
    await page.goto("/");
    await page.getByRole("button", { name: /chap nhan tat ca/i }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("script#ccth-clarity-src", { timeout: 5000 });

    // Navigate to different pages
    await page.goto("/courses");
    await page.waitForLoadState("networkidle");

    // Clarity should still be loaded
    await expect(page.locator("script#ccth-clarity-src")).toBeAttached();

    const clarity = await page.evaluate(() => (window as any).clarity);
    expect(clarity).toBeDefined();

    // Navigate to another page
    await page.goto("/blog");
    await page.waitForLoadState("networkidle");

    // Clarity should persist
    await expect(page.locator("script#ccth-clarity-src")).toBeAttached();
  });

  test("no console errors from Clarity script", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.getByRole("button", { name: /chap nhan tat ca/i }).click();
    await page.waitForLoadState("networkidle");

    // Wait for script to load
    await page.waitForTimeout(2000);

    // Check for Clarity-specific errors
    const clarityErrors = consoleErrors.filter(
      (err) =>
        err.includes("clarity") ||
        err.includes("clarity.ms") ||
        err.includes("ccth-clarity")
    );

    expect(clarityErrors).toHaveLength(0);
  });

  test("Clarity loader state is tracked correctly", async ({ page }) => {
    await page.goto("/");

    // Check initial state
    const initialState = await page.evaluate(() => (window as any).__ccthClarityLoaded);
    expect(initialState).toBeUndefined();

    // Accept consent
    await page.getByRole("button", { name: /chap nhan tat ca/i }).click();
    await page.waitForLoadState("networkidle");

    // Wait for script
    await page.waitForSelector("script#ccth-clarity-src", { timeout: 5000 });

    // State should be true after loading
    const loadedState = await page.evaluate(() => (window as any).__ccthClarityLoaded);
    expect(loadedState).toBe(true);
  });
});
