import { beforeEach, describe, expect, it, vi } from "vitest";

const { addMock } = vi.hoisted(() => ({
  addMock: vi.fn().mockResolvedValue({ id: "job-1" }),
}));

vi.mock("bullmq", () => ({
  Queue: class {
    add = addMock;
  },
}));

vi.mock("@/lib/redis-connection", () => ({
  createRedisConnectionOptions: vi.fn().mockReturnValue({}),
}));

import * as queueModule from "@/worker/queue";

describe("worker queue module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no longer exposes newsletter queue exports", () => {
    expect(queueModule).not.toHaveProperty("blogNewsletterQueue");
    expect(queueModule).not.toHaveProperty("getNewsletterWeekStart");
    expect(queueModule).not.toHaveProperty("getNewsletterWeekKey");
    expect(queueModule).not.toHaveProperty("enqueueBlogNewsletterEmail");
    expect(queueModule).not.toHaveProperty("enqueueSendBlogNewsletter");
    expect(queueModule).not.toHaveProperty("enqueueVerifyBlogNewsletterEmail");
  });

  it("keeps surviving queue functions operational", async () => {
    await queueModule.enqueueBulkEnroll({ orgId: "org-1", rows: [], requestedByParentId: "parent-1" });
    await queueModule.enqueueCertificateGeneration("enrollment-1");
    await queueModule.enqueueWeeklyReports();

    expect(addMock).toHaveBeenCalledTimes(3);
  });
});
