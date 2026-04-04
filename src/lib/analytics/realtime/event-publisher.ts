import { redis } from "@/lib/redis";

export type RealtimeEvent =
  | { type: "user_login"; userId: string; timestamp: Date }
  | { type: "lesson_start"; userId: string; lessonId: string; timestamp: Date }
  | { type: "lesson_complete"; userId: string; lessonId: string; duration: number; timestamp: Date }
  | { type: "checkout_start"; userId: string; courseId: string; timestamp: Date }
  | { type: "purchase_complete"; userId: string; amount: number; timestamp: Date };

const REALTIME_CHANNEL = "analytics:realtime";

export async function publishRealtimeEvent(event: RealtimeEvent): Promise<void> {
  await redis.publish(REALTIME_CHANNEL, JSON.stringify(event));
}
