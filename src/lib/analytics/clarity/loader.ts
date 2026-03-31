/**
 * Microsoft Clarity script loader
 * Handles consent-aware loading and double-load protection
 */

import { ClarityConfig, ClarityWindow } from "./types";

const CLARITY_SCRIPT_BASE = "https://www.clarity.ms/tag/";
const CLARITY_SCRIPT_ID = "ccth-clarity-src";

/**
 * Load Microsoft Clarity script into the document
 * @param config - Clarity configuration with project ID
 * @returns boolean indicating if script was newly loaded (false if already loaded)
 */
export function loadClarity(config: ClarityConfig): boolean {
  // Guard: must run in browser
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  const win = window as ClarityWindow;

  // Prevent double loading
  if (win.__ccthClarityLoaded || win.clarity) {
    return false;
  }

  // Skip if disabled in config
  if (config.enabled === false) {
    return false;
  }

  // Validate project ID (must be non-empty after trimming)
  const trimmedProjectId = config.projectId?.trim();
  if (!trimmedProjectId || trimmedProjectId.length === 0) {
    console.warn("[Clarity] Project ID is required to load Clarity");
    return false;
  }

  // Inject script
  const script = document.createElement("script");
  script.async = true;
  script.id = CLARITY_SCRIPT_ID;
  script.src = `${CLARITY_SCRIPT_BASE}${encodeURIComponent(config.projectId)}`;

  // Error handling
  script.onerror = () => {
    console.error("[Clarity] Failed to load Clarity script");
    win.__ccthClarityLoaded = false;
  };

  document.head.appendChild(script);
  win.__ccthClarityLoaded = true;

  return true;
}

/**
 * Check if Clarity is already loaded
 * @returns boolean indicating if Clarity script is present
 */
export function isClarityLoaded(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const win = window as ClarityWindow;
  return !!win.clarity || !!win.__ccthClarityLoaded;
}

/**
 * Set user consent for Clarity tracking
 * @param consent - true to allow tracking, false to deny
 */
export function setClarityConsent(consent: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  const win = window as ClarityWindow;
  if (win.clarity) {
    win.clarity.consent(consent);
  }
}

/**
 * Unload Clarity script (useful for consent withdrawal)
 */
export function unloadClarity(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const win = window as ClarityWindow;
  const script = document.getElementById(CLARITY_SCRIPT_ID);

  if (script && script.parentNode) {
    script.parentNode.removeChild(script);
  }

  win.__ccthClarityLoaded = false;
  // Note: win.clarity cannot be fully removed as it's managed by the Clarity script
}
