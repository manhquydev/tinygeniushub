import { publishRealtimeEvent, type RealtimeEvent } from "./event-publisher";
import { trackUserActivity } from "./counters-service";
import { recordHourlyEvent } from "./aggregator";

// Hook for tracking user login
export async function trackLogin(userId: string): Promise<void> {
  const timestamp = new Date();
  await Promise.all([
    publishRealtimeEvent({
      type: "user_login",
      userId,
      timestamp,
    }),
    recordHourlyEvent("user_login"),
  ]);
}

// Hook for tracking lesson start
export async function trackLessonStart(userId: string, lessonId: string): Promise<void> {
  const timestamp = new Date();
  await Promise.all([
    publishRealtimeEvent({
      type: "lesson_start",
      userId,
      lessonId,
      timestamp,
    }),
    recordHourlyEvent("lesson_start"),
  ]);
}

// Hook for tracking lesson completion
export async function trackLessonComplete(
  userId: string,
  lessonId: string,
  duration: number
): Promise<void> {
  const timestamp = new Date();
  await Promise.all([
    publishRealtimeEvent({
      type: "lesson_complete",
      userId,
      lessonId,
      duration,
      timestamp,
    }),
    recordHourlyEvent("lesson_complete"),
  ]);
}

// Hook for tracking checkout start
export async function trackCheckoutStart(userId: string, courseId: string): Promise<void> {
  const timestamp = new Date();
  await Promise.all([
    publishRealtimeEvent({
      type: "checkout_start",
      userId,
      courseId,
      timestamp,
    }),
    recordHourlyEvent("checkout_start"),
  ]);
}

// Hook for tracking purchase completion
export async function trackPurchaseComplete(userId: string, amount: number): Promise<void> {
  const timestamp = new Date();
  await Promise.all([
    publishRealtimeEvent({
      type: "purchase_complete",
      userId,
      amount,
      timestamp,
    }),
    recordHourlyEvent("purchase_complete"),
  ]);
}

// Hook for tracking user activity (session-based)
export async function trackActivity(userId: string, sessionId: string): Promise<void> {
  await trackUserActivity(userId, sessionId);
}

// Re-export types for consumers
export type { RealtimeEvent };
