import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

function buildSignature(commentId: string, authorEmail: string) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`${commentId}:${authorEmail.trim().toLowerCase()}`)
    .digest("hex");
}

export function createCommentReplyUnsubscribeToken(input: {
  commentId: string;
  authorEmail: string;
}) {
  const signature = buildSignature(input.commentId, input.authorEmail);
  return `${input.commentId}.${signature}`;
}

export function parseCommentReplyUnsubscribeToken(token: string) {
  const separatorIndex = token.indexOf(".");
  if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
    return null;
  }

  const commentId = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  if (commentId.length === 0 || signature.length === 0) {
    return null;
  }

  return { commentId, signature };
}

export function verifyCommentReplyUnsubscribeToken(input: {
  token: string;
  authorEmail: string;
}) {
  const parsed = parseCommentReplyUnsubscribeToken(input.token);
  if (!parsed) {
    return null;
  }

  const expectedSignature = buildSignature(parsed.commentId, input.authorEmail);
  const receivedBuffer = Buffer.from(parsed.signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(receivedBuffer, expectedBuffer)) {
    return null;
  }

  return parsed.commentId;
}
