import { expect, test } from "@playwright/test";

const MOCK_COURSE = {
  id: "course-e2e-1",
  slug: "toan-tu-duy-co-ban",
  title: "Toán Tư Duy Cơ Bản",
  description: "Khoá học Toán tư duy cho bé 2-4 tuổi",
  price: 299000,
  status: "PUBLISHED",
  lessons: [
    { id: "cl-1", title: "Bài 1: Đếm số", isPreview: true, order: 1 },
    { id: "cl-2", title: "Bài 2: So sánh", isPreview: false, order: 2 },
  ],
};

const MOCK_ENROLLMENT = {
  id: "enroll-e2e-1",
  courseId: "course-e2e-1",
  parentId: "parent-e2e",
  completedAt: null,
  certificateUrl: null,
};

test("guest can browse course catalog and view course detail", async ({ page }) => {
  await page.route("**/api/courses", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: { courses: [MOCK_COURSE] } }),
    });
  });

  await page.route("**/api/courses/toan-tu-duy-co-ban", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: { course: MOCK_COURSE } }),
    });
  });

  await page.route("**/api/courses/toan-tu-duy-co-ban/enrollment", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: { enrollment: null } }),
    });
  });

  await page.goto("/courses");
  await expect(page).toHaveURL(/\/courses/);

  await page.goto("/courses/toan-tu-duy-co-ban");
  await expect(page).toHaveURL(/\/courses\/toan-tu-duy-co-ban/);
});

test("authenticated parent can checkout and enroll in a course", async ({ page }) => {
  let checkoutCallCount = 0;

  await page.route("**/api/courses/toan-tu-duy-co-ban", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: { course: MOCK_COURSE } }),
    });
  });

  await page.route("**/api/courses/toan-tu-duy-co-ban/enrollment", async (route) => {
    if (checkoutCallCount > 0) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, data: { enrollment: MOCK_ENROLLMENT } }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, data: { enrollment: null } }),
      });
    }
  });

  await page.route("**/api/courses/toan-tu-duy-co-ban/checkout", async (route) => {
    checkoutCallCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          checkoutUrl: "/courses/toan-tu-duy-co-ban?enrolled=1&enrollment_id=enroll-e2e-1",
        },
      }),
    });
  });

  await page.goto("/courses/toan-tu-duy-co-ban");

  const checkoutResp = await page.request.post("/api/courses/toan-tu-duy-co-ban/checkout", {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({}),
  });
  expect(checkoutResp.ok()).toBeTruthy();
  const checkoutBody = (await checkoutResp.json()) as { ok?: boolean; data?: { checkoutUrl?: string } };
  expect(checkoutBody.ok).toBe(true);
  expect(checkoutBody.data?.checkoutUrl).toContain("enrolled=1");

  expect(checkoutCallCount).toBe(1);
});

test("enrolled parent can complete course and download certificate", async ({ page }) => {
  let completeCallCount = 0;

  const enrolledCourse = {
    ...MOCK_ENROLLMENT,
    completedAt: null,
    certificateUrl: null,
  };

  await page.route("**/api/courses/toan-tu-duy-co-ban/enrollment", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: { enrollment: enrolledCourse } }),
    });
  });

  await page.route("**/api/courses/toan-tu-duy-co-ban/complete", async (route) => {
    completeCallCount += 1;
    enrolledCourse.completedAt = new Date().toISOString() as unknown as null;
    enrolledCourse.certificateUrl = "/api/certificates/enroll-e2e-1" as unknown as null;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: { enrollment: enrolledCourse },
      }),
    });
  });

  await page.route("**/api/certificates/enroll-e2e-1", async (route) => {
    const pdfMock = Buffer.from("%PDF-1.4 mock certificate content");
    await route.fulfill({
      status: 200,
      contentType: "application/pdf",
      body: pdfMock,
    });
  });

  const completeResp = await page.request.post("/api/courses/toan-tu-duy-co-ban/complete", {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({}),
  });
  expect(completeResp.ok()).toBeTruthy();
  const completeBody = (await completeResp.json()) as {
    ok?: boolean;
    data?: { enrollment?: { completedAt?: string; certificateUrl?: string } };
  };
  expect(completeBody.ok).toBe(true);
  expect(completeBody.data?.enrollment?.completedAt).toBeTruthy();
  expect(completeBody.data?.enrollment?.certificateUrl).toContain("certificates");

  const certResp = await page.request.get("/api/certificates/enroll-e2e-1");
  expect(certResp.ok()).toBeTruthy();
  expect(certResp.headers()["content-type"]).toContain("application/pdf");

  expect(completeCallCount).toBe(1);
});
