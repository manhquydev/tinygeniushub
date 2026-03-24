import { SignJWT, importPKCS8 } from "jose";
import { env } from "@/lib/env";

const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GA4_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GA4_DATA_API_BASE = "https://analyticsdata.googleapis.com/v1beta";
const CACHE_TTL_MS = 5 * 60 * 1000;

type Ga4Status = "disabled" | "ready" | "error";

export type AdminGa4Snapshot = {
  status: Ga4Status;
  window: "7d";
  sessions: number;
  activeUsers: number;
  eventCounts: {
    checkoutStarted: number;
    purchaseSucceeded: number;
    lessonCompleted: number;
    reportViewed: number;
  };
  topEvents: Array<{ eventName: string; eventCount: number }>;
  propertyId?: string;
  errorMessage?: string;
};

type CachedGa4Snapshot = {
  expiresAt: number;
  value: AdminGa4Snapshot;
};

let snapshotCache: CachedGa4Snapshot | null = null;

function readGa4Credentials() {
  const propertyId = env.GA4_PROPERTY_ID?.trim();
  const clientEmail = env.GA4_SERVICE_ACCOUNT_CLIENT_EMAIL?.trim();
  const privateKeyRaw = env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();
  const privateKey = privateKeyRaw?.replace(/\\n/g, "\n");
  return { propertyId, clientEmail, privateKey };
}

function toInt(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function summarizeEventCount(rows: Array<{ eventName: string; eventCount: number }>, eventName: string) {
  const row = rows.find((candidate) => candidate.eventName === eventName);
  return row?.eventCount ?? 0;
}

async function requestAccessToken(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(privateKey, "RS256");
  const assertion = await new SignJWT({ scope: GA4_SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(clientEmail)
    .setAudience(GA4_TOKEN_ENDPOINT)
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60)
    .sign(key);

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const response = await fetch(GA4_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const payload = (await response.json()) as { access_token?: string; error?: string };
  if (!response.ok || !payload.access_token) {
    const message = payload.error ?? `token_exchange_failed_${response.status}`;
    throw new Error(message);
  }

  return payload.access_token;
}

async function runReport(propertyId: string, accessToken: string, body: Record<string, unknown>) {
  const response = await fetch(`${GA4_DATA_API_BASE}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const fallback = `ga4_report_failed_${response.status}`;
    const text = await response.text();
    throw new Error(text.slice(0, 200) || fallback);
  }

  return response.json() as Promise<{
    rows?: Array<{
      dimensionValues?: Array<{ value?: string }>;
      metricValues?: Array<{ value?: string }>;
    }>;
  }>;
}

export async function getAdminGa4Snapshot(): Promise<AdminGa4Snapshot> {
  if (snapshotCache && Date.now() < snapshotCache.expiresAt) {
    return snapshotCache.value;
  }

  const { propertyId, clientEmail, privateKey } = readGa4Credentials();
  if (!propertyId || !clientEmail || !privateKey) {
    return {
      status: "disabled",
      window: "7d",
      sessions: 0,
      activeUsers: 0,
      eventCounts: { checkoutStarted: 0, purchaseSucceeded: 0, lessonCompleted: 0, reportViewed: 0 },
      topEvents: [],
    };
  }

  try {
    const accessToken = await requestAccessToken(clientEmail, privateKey);
    const metricsReport = await runReport(propertyId, accessToken, {
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
    });
    const eventsReport = await runReport(propertyId, accessToken, {
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 25,
    });

    const metricRow = metricsReport.rows?.[0];
    const sessions = toInt(metricRow?.metricValues?.[0]?.value);
    const activeUsers = toInt(metricRow?.metricValues?.[1]?.value);
    const topEvents = (eventsReport.rows ?? []).map((row) => ({
      eventName: row.dimensionValues?.[0]?.value ?? "unknown",
      eventCount: toInt(row.metricValues?.[0]?.value),
    }));

    const snapshot: AdminGa4Snapshot = {
      status: "ready",
      propertyId,
      window: "7d",
      sessions,
      activeUsers,
      eventCounts: {
        checkoutStarted: summarizeEventCount(topEvents, "course_checkout_started"),
        purchaseSucceeded: summarizeEventCount(topEvents, "course_purchase_succeeded"),
        lessonCompleted: summarizeEventCount(topEvents, "lesson_complete"),
        reportViewed: summarizeEventCount(topEvents, "report_viewed"),
      },
      topEvents: topEvents.slice(0, 10),
    };

    snapshotCache = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      value: snapshot,
    };
    return snapshot;
  } catch (error) {
    return {
      status: "error",
      propertyId,
      window: "7d",
      sessions: 0,
      activeUsers: 0,
      eventCounts: { checkoutStarted: 0, purchaseSucceeded: 0, lessonCompleted: 0, reportViewed: 0 },
      topEvents: [],
      errorMessage: error instanceof Error ? error.message : "ga4_unknown_error",
    };
  }
}
