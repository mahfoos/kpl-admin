"use client";

import Image from "next/image";
import { formatAmount } from "@/lib/api";
import type { AuctionState, Team } from "@/types";

/** Compact live purse board for all franchises. */
export function TeamBalances({
  state,
  teams,
  budget,
  highlightTeamId,
}: {
  state: AuctionState | null;
  teams: Team[];
  budget: number;
  highlightTeamId?: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {teams.map((team) => {
        const ts = state?.teams[team.id];
        const spent = ts?.spent ?? 0;
        const left = budget - spent;
        const count = ts?.playerIds.length ?? 0;
        const isLeading = highlightTeamId === team.id;
        const pctLeft = Math.max(0, Math.round((left / budget) * 100));

        return (
          <div
            key={team.id}
            className={`relative overflow-hidden rounded-2xl border p-3 transition-all duration-300 ${
              isLeading
                ? "border-gold bg-gold/10 shadow-[0_0_30px_-6px_rgba(245,183,0,0.6)]"
                : "border-white/10 bg-navy-light/40"
            }`}
          >
            <div className="flex items-center justify-between">
              {team.logo ? (
                <Image
                  src={team.logo}
                  alt={team.name}
                  width={36}
                  height={36}
                  className="size-9 rounded-lg object-cover ring-1 ring-white/15"
                />
              ) : (
                <span
                  className="font-display text-lg font-extrabold leading-none"
                  style={{ color: team.primary }}
                >
                  {team.initials}
                </span>
              )}
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/70">
                {count} {count === 1 ? "player" : "players"}
              </span>
            </div>

            <p className="mt-2 truncate text-[11px] font-semibold uppercase tracking-wide text-white/50">
              {team.shortName}
            </p>

            <p className="mt-1 font-display text-xl font-extrabold text-white tabular-nums">
              {formatAmount(left)}
            </p>
            <p className="text-[10px] font-medium text-white/40">purse left</p>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pctLeft}%`,
                  background:
                    pctLeft > 30
                      ? `linear-gradient(90deg, ${team.primary}, ${team.secondary})`
                      : "linear-gradient(90deg,#ef4444,#b91c1c)",
                }}
              />
            </div>

            {isLeading && (
              <span className="absolute right-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[9px] font-black uppercase text-navy">
                Leading
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
