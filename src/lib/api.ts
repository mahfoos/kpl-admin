import type { AuctionAction, AuctionMeta, AuctionState } from "@/types";

/**
 * Base URL of the KPL screen app, which owns the auction state + API.
 * Set NEXT_PUBLIC_AUCTION_API to the screen machine's address on the LAN.
 */
export const API_BASE = (
  process.env.NEXT_PUBLIC_AUCTION_API ?? "http://localhost:3000"
).replace(/\/$/, "");

export const STREAM_URL = `${API_BASE}/api/auction/stream`;

/** Load the roster + tuning once on startup. */
export async function fetchMeta(): Promise<AuctionMeta> {
  const res = await fetch(`${API_BASE}/api/auction/meta`);
  if (!res.ok) throw new Error(`meta ${res.status}`);
  return (await res.json()) as AuctionMeta;
}

/** Read the current auction state from the screen app. Null on failure. */
export async function fetchState(): Promise<AuctionState | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auction/state`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as AuctionState;
  } catch {
    return null;
  }
}

/** POST an auctioneer action; returns the error string (if any). */
export async function sendAction(action: AuctionAction): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auction/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    return data.ok ? null : data.error ?? "Action failed";
  } catch {
    return "Network error — check the screen app is running";
  }
}

/** Short money form, e.g. "12,500". */
export function formatAmount(amount: number): string {
  return amount.toLocaleString("en-LK");
}
