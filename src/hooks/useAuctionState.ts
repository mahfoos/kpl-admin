"use client";

import { useEffect, useRef, useState } from "react";
import { sendAction } from "@/lib/api";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { AuctionAction, AuctionState } from "@/types";

/**
 * Subscribes to the live auction over Supabase Realtime (reads), and POSTs
 * auctioneer actions to the screen app's API (writes, with budget validation).
 */
export function useAuctionController() {
  const [state, setState] = useState<AuctionState | null>(null);
  const [connected, setConnected] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setConnected(false);
      return;
    }

    let active = true;

    supabase
      .from("auction_snapshot")
      .select("state")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.state) setState(data.state as AuctionState);
      });

    const channel = supabase
      .channel("auction-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "auction_snapshot", filter: "id=eq.1" },
        (payload) => {
          const row = payload.new as { state?: AuctionState };
          if (row?.state) setState(row.state);
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
      return err;
    } finally {
      pending.current = false;
    }
  }

  return { state, connected, act };
}
