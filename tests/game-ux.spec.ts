import { test, expect } from "@playwright/test";

test.describe("Main Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=CHAD", { timeout: 20000 });
  });

  test("renders the main menu with title and mode buttons", async ({
    page,
  }) => {
    await expect(page.getByText("CHAD")).toBeVisible();
    await expect(page.getByText("POWERS")).toBeVisible();
    await expect(page.getByText("PRACTICE MODE")).toBeVisible();
    await expect(page.getByText("CHALLENGE MODE")).toBeVisible();
  });

  test("shows control hints", async ({ page }) => {
    await expect(page.getByText("Move")).toBeVisible();
    await expect(page.getByText("Swipe to throw")).toBeVisible();
  });

  test("navigates to practice mode on button click", async ({ page }) => {
    await page.getByText("PRACTICE MODE").click();
    await expect(page.getByText("Practice Mode")).toBeVisible({
      timeout: 15000,
    });
  });

  test("navigates to challenge mode on button click", async ({ page }) => {
    await page.getByText("CHALLENGE MODE").click();
    await expect(page.getByText("Challenge Mode")).toBeVisible({
      timeout: 15000,
    });
  });
});

test.describe("Practice Mode Gameplay", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=PRACTICE MODE", { timeout: 20000 });
    await page.getByText("PRACTICE MODE").click();
    await page.waitForSelector("text=Practice Mode", { timeout: 15000 });
  });

  test("displays practice HUD with score and accuracy", async ({ page }) => {
    await expect(page.getByText("Practice Mode")).toBeVisible();
    await expect(page.getByText("Throws")).toBeVisible();
    await expect(page.getByText("Hits")).toBeVisible();
  });

  test("displays target indicators", async ({ page }) => {
    await expect(page.getByText("Targets")).toBeVisible({ timeout: 10000 });
    const hitText = page.locator("text=/\\d+\\/\\d+ hit/");
    await expect(hitText).toBeVisible({ timeout: 10000 });
  });

  test("shows restart button", async ({ page }) => {
    await expect(page.getByLabel("Restart game")).toBeVisible();
  });

  test("canvas element is present for 3D scene", async ({ page }) => {
    const canvas = page.locator("canvas");
    await expect(canvas.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Challenge Mode Gameplay", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=CHALLENGE MODE", { timeout: 20000 });
    await page.getByText("CHALLENGE MODE").click();
    // Challenge mode loads 3D scene + HUD + receivers - wait for canvas first
    await page.waitForSelector("canvas", { timeout: 30000 });
    // Then wait for any HUD text to confirm React rendered
    await page.waitForTimeout(2000);
  });

  test("displays challenge HUD with timer and score", async ({ page }) => {
    await expect(page.getByText("Play Clock")).toBeVisible({ timeout: 15000 });
  });

  test("displays receiver list", async ({ page }) => {
    await expect(page.getByText("Receivers")).toBeVisible({ timeout: 15000 });
  });

  test("displays multiplier bars", async ({ page }) => {
    await expect(page.getByText("Multipliers")).toBeVisible({ timeout: 15000 });
  });

  test("timer counts down", async ({ page }) => {
    const timeElement = page.locator(".tabular-nums").first();
    await expect(timeElement).toBeVisible({ timeout: 20000 });
    const initialTime = await timeElement.textContent({ timeout: 10000 });
    await page.waitForTimeout(3000);
    const newTime = await timeElement.textContent({ timeout: 10000 });
    expect(newTime).not.toBe(initialTime);
  });
});

test.describe("Mobile Touch Interactions", () => {
  test.use({
    hasTouch: true,
    viewport: { width: 412, height: 915 },
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=PRACTICE MODE", { timeout: 20000 });
    await page.getByText("PRACTICE MODE").click();
    await page.waitForSelector("text=Practice Mode", { timeout: 20000 });
  });

  test("game renders at mobile viewport", async ({ page }) => {
    const canvas = page.locator("canvas");
    await expect(canvas.first()).toBeVisible({ timeout: 15000 });
  });

  test("touch zones are present - joystick and throw area", async ({
    page,
  }) => {
    // Joystick area at bottom-left
    const joystickArea = page.locator("div.absolute.bottom-8.left-8");
    await expect(joystickArea).toBeVisible({ timeout: 5000 });

    // Throw zone on right half
    const throwZone = page.locator("div.absolute.top-0.right-0.bottom-0");
    await expect(throwZone.first()).toBeVisible({ timeout: 5000 });
  });

  test("touch on game area does not scroll page", async ({ page }) => {
    test.setTimeout(60000);
    const initialScroll = await page.evaluate(() => window.scrollY);
    await page.touchscreen.tap(200, 450);
    await page.waitForTimeout(500);
    const finalScroll = await page.evaluate(() => window.scrollY);
    expect(finalScroll).toBe(initialScroll);
  });
});
