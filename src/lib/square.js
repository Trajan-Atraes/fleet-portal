// Square configuration — sourced from .env (VITE_ prefix for Vite)
// To switch to production: update .env values only, zero code changes needed.

export const SQUARE_APP_ID       = (import.meta.env.VITE_SQUARE_APP_ID || "sq0idp-VOz9oAv5otNVnav2asxMmw").trim();
export const SQUARE_LOCATION_ID  = (import.meta.env.VITE_SQUARE_LOCATION_ID || "L0DFWVF71J9W6").trim();
export const SQUARE_ENVIRONMENT  = "production";

// Production CDN — sandbox no longer used
export const SQUARE_CDN_URL = "https://web.squarecdn.com/v1/square.js";

// Load the Square Web Payments SDK script once (idempotent).
// Returns a promise that resolves when window.Square is available.
export function loadSquareSDK() {
  return new Promise((resolve, reject) => {
    if (window.Square) { resolve(window.Square); return; }
    const existing = document.querySelector(`script[src="${SQUARE_CDN_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Square));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = SQUARE_CDN_URL;
    script.onload  = () => resolve(window.Square);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
