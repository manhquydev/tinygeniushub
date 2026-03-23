import { describe, expect, it } from "vitest";
import {
  createCommentReplyUnsubscribeToken,
  parseCommentReplyUnsubscribeToken,
  verifyCommentReplyUnsubscribeToken,
} from "@/modules/blog/comment-reply-notification-token";

describe("comment reply notification token", () => {
  const commentId = "cmt_123";
  const authorEmail = "parent@example.com";

  it("creates and verifies a valid unsubscribe token", () => {
    const token = createCommentReplyUnsubscribeToken({
      commentId,
      authorEmail,
    });

    const verifiedCommentId = verifyCommentReplyUnsubscribeToken({
      token,
      authorEmail,
    });

    expect(verifiedCommentId).toBe(commentId);
  });

  it("returns null when token format is invalid", () => {
    expect(parseCommentReplyUnsubscribeToken("invalid-token")).toBeNull();
    expect(
      verifyCommentReplyUnsubscribeToken({
        token: "invalid-token",
        authorEmail,
      }),
    ).toBeNull();
  });

  it("returns null when email does not match signature", () => {
    const token = createCommentReplyUnsubscribeToken({
      commentId,
      authorEmail,
    });

    const verifiedCommentId = verifyCommentReplyUnsubscribeToken({
      token,
      authorEmail: "other@example.com",
    });

    expect(verifiedCommentId).toBeNull();
  });
});
