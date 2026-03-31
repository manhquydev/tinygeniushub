/**
 * Microsoft Clarity TypeScript type definitions
 * Provides comprehensive type safety for Clarity analytics integration
 */

// Window augmentation for Clarity
declare global {
  interface Window {
    clarity?: ClarityAPI;
    __ccthClarityLoaded?: boolean;
  }
}

export interface ClarityWindow extends Window {
  clarity?: ClarityAPI;
  __ccthClarityLoaded?: boolean;
}

// Main Clarity API interface
export interface ClarityAPI {
  // Event tracking - send custom events to Clarity
  event: (name: string, options?: Record<string, unknown>) => void;
  // Session identification - associate user with session
  identify: (userId: string, sessionId?: string) => void;
  // Custom tags - add metadata to recordings
  setTag: (key: string, value: string) => void;
  // Upgrade session - mark session as important
  upgrade: (reason: string) => void;
  // Consent management - handle user consent for tracking
  consent: (consent: boolean) => void;
}

// Configuration options for Clarity initialization
export interface ClarityConfig {
  projectId: string;
  uploadInterval?: number;
  delayDom?: boolean;
  // Optional: enable in specific environments only
  enabled?: boolean;
}

// Data export types for Clarity API
export interface ClarityExportParams {
  startDate: string; // ISO 8601 format
  endDate: string;
  format?: "json" | "csv";
}

// Clarity session information
export interface ClaritySession {
  sessionId: string;
  userId: string;
  startTime: string;
  endTime: string;
  pageViews: number;
  duration?: number;
  deviceType?: "desktop" | "mobile" | "tablet";
}

// Clarity recording metadata
export interface ClarityRecording {
  recordingId: string;
  sessionId: string;
  url: string;
  startTime: string;
  duration: number;
  clicks: number;
  scrolls: number;
}

// Error types for Clarity operations
export class ClarityError extends Error {
  constructor(
    message: string,
    public readonly code: "LOAD_FAILED" | "NOT_INITIALIZED" | "CONSENT_DENIED"
  ) {
    super(message);
    this.name = "ClarityError";
  }
}
