import { beforeEach, describe, expect, it, vi } from "vitest";
import { LifecycleEmailType } from "@prisma/client";

const {
  parentFindUniqueMock,
  lifecycleFindUniqueMock,
  lifecycleCreateMock,
  subscriptionFindUniqueMock,
  sendTransactionalEmailMock,
  buildLifecycleEmailContentMock,
  createMarketingUnsubscribeTokenMock,
} = vi.hoisted(() => ({
  parentFindUniqueMock: vi.fn(),
  lifecycleFindUniqueMock: vi.fn(),
  lifecycleCreateMock: vi.fn(),
  subscriptionFindUniqueMock: vi.fn(),
  sendTransactionalEmailMock: vi.fn(),
  buildLifecycleEmailContentMock: vi.fn(),
  createMarketingUnsubscribeTokenMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    parentAccount: {
      findUnique: parentFindUniqueMock,
    },
    lifecycleEmailLog: {
      findUnique: lifecycleFindUniqueMock,
      create: lifecycleCreateMock,
    },
    subscription: {
      findUnique: subscriptionFindUniqueMock,
    },
  },
}));

vi.mock("@/lib/email/transactional-email-sender", () => ({
  sendTransactionalEmail: sendTransactionalEmailMock,
}));

vi.mock("@/modules/platform/lifecycle-email-copy-builder", () => ({
  buildLifecycleEmailContent: buildLifecycleEmailContentMock,
}));

vi.mock("@/modules/platform/marketing-email-unsubscribe-token", () => ({
  createMarketingEmailUnsubscribeToken: createMarketingUnsubscribeTokenMock,
}));

vi.mock("@/lib/email/project-email-template-builder", () => ({
  resolveEmailPublicBaseUrl: vi.fn(() => "https://cungcontuhoc.io.vn"),
}));

import { sendLifecycleEmail } from "@/modules/platform/lifecycle-email-service";

describe("sendLifecycleEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    parentFindUniqueMock.mockResolvedValue({
      id: "parent-1",
      email: "parent@example.com",
      displayName: "Parent",
      preferences: {
        marketingEmailOptIn: true,
      },
    });
    lifecycleFindUniqueMock.mockResolvedValue(null);
    lifecycleCreateMock.mockResolvedValue({});
    subscriptionFindUniqueMock.mockResolvedValue(null);
    buildLifecycleEmailContentMock.mockReturnValue({
      subject: "Lifecycle subject",
      text: "Lifecycle body",
    });
    createMarketingUnsubscribeTokenMock.mockReturnValue("token-123");
    sendTransactionalEmailMock.mockResolvedValue({
      provider: "mock_email",
      attempted: true,
      sent: true,
    });
  });

  it("skips sending when parent already opted out marketing emails", async () => {
    parentFindUniqueMock.mockResolvedValueOnce({
      id: "parent-1",
      email: "parent@example.com",
      displayName: "Parent",
      preferences: {
        marketingEmailOptIn: false,
      },
    });

    await sendLifecycleEmail("parent-1", LifecycleEmailType.TRIAL_D1);

    expect(sendTransactionalEmailMock).not.toHaveBeenCalled();
    expect(lifecycleCreateMock).not.toHaveBeenCalled();
  });

  it("appends unsubscribe link when sending lifecycle email", async () => {
    await sendLifecycleEmail("parent-1", LifecycleEmailType.TRIAL_D1);

    expect(sendTransactionalEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "parent@example.com",
        subject: "Lifecycle subject",
        text: expect.stringContaining(
          "https://cungcontuhoc.io.vn/api/email/marketing/unsubscribe?token=token-123",
        ),
      }),
    );
    expect(lifecycleCreateMock).toHaveBeenCalledWith({
      data: { parentId: "parent-1", type: LifecycleEmailType.TRIAL_D1 },
    });
  });
});
