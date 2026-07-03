"use client";

import { useEffect, useRef, useState } from "react";
import { fetchState, sendAction } from "@/lib/api";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { AuctionAction, AuctionState } from "@/types";

/**
 * Reads the live auction and POSTs auctioneer actions to the screen app's API.
 *
 * Reads come from Supabase Realtime when the anon key is configured; otherwise
 * we poll the screen app's `/api/auction/state` once a second. Either way, after
 * an action we refresh immediately so the panel reflects the change at once.
 */
export function useAuctionController() {
  const [state, setState] = useState<AuctionState | null>(null);
  const [connected, setConnected] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    let active = true;

    async function refresh(trackConnection = false) {
      const data = await fetchState();
      if (!active) return;
      if (data) {
        setState(data);
        if (trackConnection) setConnected(true);
      } else if (trackConnection) {
        setConnected(false);
      }
    }

    const supabase = getBrowserSupabase();

    // No anon key → poll the screen app's API.
    if (!supabase) {
      refresh(true);
      const id = setInterval(() => refresh(true), 1000);
      return () => {
        active = false;
        clearInterval(id);
      };
    }

    // Anon key present → load once, then receive instant pushes.
    refresh();
    const channel = supabase
      .channel("auction-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "auction_snapshot", filter: "id=eq.1" },
        (payload) => {
          const row = payload.new as { state?: AuctionState };
          if (active && row?.state) setState(row.state);
        },
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function act(action: AuctionAction): Promise<string | null> {
    if (pending.current) return null;
    pending.current = true;
    try {
      const err = await sendAction(action);
      // Reflect the change right away (works with or without Realtime).
      const data = await fetchState();
      if (data) setState(data);
      return err;
    } finally {
      pending.current = false;
    }
  }

  return { state, connected, act };
}
