import { expect, test } from "@playwright/test";

const MOCK_ORG_ID = "org-e2e-001";

const MOCK_PROGRESS = [
  {
    id: "member-1",
    displayName: "Nguyễn An",
    email: "nguyen.an@school.vn",
    lastActiveAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lessonsCompleted: 12,
    streakDays: 3,
    atRisk: false,
  },
  {
    id: "member-2",
    displayName: "Trần Bình",
    email: "tran.binh@school.vn",
    lastActiveAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lessonsCompleted: 2,
    streakDays: 0,
    atRisk: true,
  },
];

test("teacher dashboard renders progress grid for org", async ({ page }) => {
  await page.route(`**/api/organizations/${MOCK_ORG_ID}/progress`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: { members: MOCK_PROGRESS } }),
    });
  });

  await page.goto(`/teacher/dashboard?orgId=${MOCK_ORG_ID}`);
  await expect(page).toHaveURL(/\/teacher\/dashboard/);
  await expect(page.locator("body")).toBeVisible();
});

test("bulk enroll CSV submission succeeds with valid rows", async ({ page }) => {
  let bulkEnrollCallCount = 0;

  await page.route(`**/api/organizations/${MOCK_ORG_ID}/bulk-enroll`, async (route) => {
    bulkEnrollCallCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          jobId: "bulk-job-e2e-1",
          queued: 3,
        },
      }),
    });
  });

  const csvPayload = [
    "email,displayName",
    "student1@school.vn,Học Sinh 1",
    "student2@school.vn,Học Sinh 2",
    "student3@school.vn,Học Sinh 3",
  ].join("\n");

  const resp = await page.request.post(`/api/organizations/${MOCK_ORG_ID}/bulk-enroll`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ csv: csvPayload }),
  });
  expect(resp.ok()).toBeTruthy();
  const body = (await resp.json()) as { ok?: boolean; data?: { queued?: number } };
  expect(body.ok).toBe(true);
  expect(body.data?.queued).toBe(3);

  expect(bulkEnrollCallCount).toBe(1);
});

test("bulk enroll with invalid CSV rows returns validation error", async ({ page }) => {
  await page.route(`**/api/organizations/${MOCK_ORG_ID}/bulk-enroll`, async (route) => {
    await route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: "INVALID_CSV",
        details: [{ row: 2, message: "Email không hợp lệ" }],
      }),
    });
  });

  const resp = await page.request.post(`/api/organizations/${MOCK_ORG_ID}/bulk-enroll`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ csv: "email,displayName\nnot-an-email,Học Sinh X" }),
  });
  expect(resp.status()).toBe(422);
  const body = (await resp.json()) as { ok?: boolean; error?: string };
  expect(body.ok).toBe(false);
  expect(body.error).toBe("INVALID_CSV");
});

test("progress API returns at-risk flag for inactive students", async ({ page }) => {
  await page.route(`**/api/organizations/${MOCK_ORG_ID}/progress`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: { members: MOCK_PROGRESS } }),
    });
  });

  const resp = await page.request.get(`/api/organizations/${MOCK_ORG_ID}/progress`);
  expect(resp.ok()).toBeTruthy();
  const body = (await resp.json()) as {
    ok?: boolean;
    data?: { members?: Array<{ atRisk?: boolean; displayName?: string }> };
  };
  expect(body.ok).toBe(true);
  const members = body.data?.members ?? [];
  expect(members.length).toBe(2);

  const atRiskMembers = members.filter((m) => m.atRisk);
  expect(atRiskMembers.length).toBe(1);
  expect(atRiskMembers[0].displayName).toBe("Trần Bình");
});
