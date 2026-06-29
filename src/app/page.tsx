"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Gavel,
  Monitor,
  RotateCcw,
  Undo2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { TeamBalances } from "@/components/auction/TeamBalances";
import { useAuctionController } from "@/hooks/useAuctionState";
import { API_BASE, fetchMeta, formatAmount } from "@/lib/api";
import type { AuctionMeta, AuctionState } from "@/types";

export default function AdminPage() {
  const { state, connected, act } = useAuctionController();
  const [meta, setMeta] = useState<AuctionMeta | null>(null);
  const [metaError, setMetaError] = useState(false);
  const [step, setStep] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ kind: "error" | "ok"; msg: string } | null>(
    null,
  );

  useEffect(() => {
    fetchMeta()
      .then((m) => {
        setMeta(m);
        setStep(m.steps[1] ?? m.steps[0]);
      })
      .catch(() => setMetaError(true));
  }, []);

  const playerById = useMemo(
    () => new Map((meta?.players ?? []).map((p) => [p.id, p])),
    [meta],
  );

  async function run(action: Parameters<typeof act>[0]) {
    const err = await act(action);
    setNotice(err ? { kind: "error", msg: err } : null);
  }

  if (metaError) {
    return (
      <main className="grid min-h-[100svh] place-items-center bg-ink px-6 text-center">
        <div>
          <WifiOff className="mx-auto size-10 text-red-400" />
          <h1 className="mt-4 font-display text-2xl font-bold text-white">
            Can&apos;t reach the screen app
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/50">
            Tried <code className="text-white/70">{API_BASE}</code>. Make sure the KPL
            screen app is running and that{" "}
            <code className="text-white/70">NEXT_PUBLIC_AUCTION_API</code> points to it,
            then reload.
          </p>
        </div>
      </main>
    );
  }

  if (!meta || step === null) {
    return (
      <main className="grid min-h-[100svh] place-items-center bg-ink text-white/50">
        Loading auction…
      </main>
    );
  }

  const { teams, players, budget, baseDefault } = meta;
  const current = state?.current ?? null;
  const currentPlayer = current ? playerById.get(current.playerId) : null;
  const base = currentPlayer?.basePriceValue ?? baseDefault;
  const isLive = current?.status === "live";

  return (
    <main className="min-h-[100svh] bg-ink pb-16">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Gavel className="size-5 text-gold" />
            <h1 className="font-display text-lg font-extrabold text-white">
              KPL Auctioneer
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                connected
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {connected ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
              {connected ? "Live" : "Offline"}
            </span>
          </div>
          <a
            href={API_BASE}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:text-white"
          >
            <Monitor className="size-3.5" />
            Open Big Screen
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {notice && (
          <div
            className={`mb-4 flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium ${
              notice.kind === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-green-500/30 bg-green-500/10 text-green-300"
            }`}
          >
            {notice.msg}
            <button onClick={() => setNotice(null)} aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Current lot control */}
        <section className="rounded-3xl border border-white/10 bg-navy-light/40 p-5 sm:p-6">
          {current && currentPlayer ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">
                    On The Block
                  </p>
                  <h2 className="font-display text-3xl font-extrabold text-white">
                    {currentPlayer.name}
                  </h2>
                  <p className="text-sm text-white/50">
                    {currentPlayer.role} · Base {formatAmount(base)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">
                    {current.leadingTeamId ? "Current Bid" : "Opening"}
                  </p>
                  <p className="text-gradient-gold font-display text-4xl font-black tabular-nums">
                    {formatAmount(current.bid)}
                  </p>
                  <LeadLabel state={state} meta={meta} />
                </div>
              </div>

              {current.status === "sold" && (
                <p className="mt-4 rounded-xl bg-green-500/15 px-4 py-2 text-sm font-bold text-green-300">
                  SOLD — pick the next player below.
                </p>
              )}
              {current.status === "unsold" && (
                <p className="mt-4 rounded-xl bg-red-500/15 px-4 py-2 text-sm font-bold text-red-300">
                  UNSOLD — pick the next player below.
                </p>
              )}

              {isLive && (
                <>
                  {/* Step selector */}
                  <div className="mt-5">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-white/40">
                      Bid Increment
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {meta.steps.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStep(s)}
                          className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                            step === s
                              ? "bg-gold text-navy"
                              : "border border-white/15 bg-white/5 text-white/70 hover:text-white"
                          }`}
                        >
                          +{formatAmount(s)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Team bid buttons */}
                  <div className="mt-5">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-white/40">
                      {current.leadingTeamId
                        ? `Tap a team to bid +${formatAmount(step)}`
                        : "Tap the team that opens at base"}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {teams.map((team) => {
                        const spent = state?.teams[team.id]?.spent ?? 0;
                        const left = budget - spent;
                        const nextBid =
                          current.leadingTeamId === null
                            ? current.bid
                            : current.bid + step;
                        const isLeading = current.leadingTeamId === team.id;
                        const disabled = isLeading || nextBid > left;
                        return (
                          <button
                            key={team.id}
                            disabled={disabled}
                            onClick={() =>
                              run({ type: "RAISE", teamId: team.id, amount: step })
                            }
                            className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-35 ${
                              isLeading
                                ? "border-gold bg-gold/15"
                                : "border-white/10 bg-white/5 hover:border-gold/50 hover:bg-white/10"
                            }`}
                          >
                            <span className="flex w-full items-center justify-between">
                              <span
                                className="font-display text-base font-extrabold"
                                style={{ color: team.primary }}
                              >
                                {team.initials}
                              </span>
                              {isLeading && (
                                <span className="text-[9px] font-black uppercase text-gold">
                                  Leading
                                </span>
                              )}
                            </span>
                            <span className="truncate text-xs font-semibold text-white/70">
                              {team.shortName}
                            </span>
                            <span className="text-[10px] font-medium text-white/40">
                              {formatAmount(left)} left
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resolve actions */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      onClick={() => run({ type: "SOLD" })}
                      disabled={!current.leadingTeamId}
                      className="inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-2.5 text-sm font-black uppercase tracking-wide text-navy transition-all hover:bg-green-400 disabled:opacity-40"
                    >
                      <Check className="size-4" /> Sold
                    </button>
                    <button
                      onClick={() => run({ type: "UNSOLD" })}
                      className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-300 transition-all hover:bg-red-500/20"
                    >
                      <X className="size-4" /> Unsold
                    </button>
                    <button
                      onClick={() => run({ type: "UNDO" })}
                      disabled={current.raises.length === 0}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 transition-all hover:bg-white/10 disabled:opacity-40"
                    >
                      <Undo2 className="size-4" /> Undo Bid
                    </button>
                  </div>
                </>
              )}

              {!isLive && (
                <button
                  onClick={() => run({ type: "CLEAR" })}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 transition-all hover:bg-white/10"
                >
                  Clear Screen
                </button>
              )}
            </>
          ) : (
            <p className="py-8 text-center text-white/50">
              No player on the block. Pick one below to put them up for auction.
            </p>
          )}
        </section>

        {/* Player picker */}
        <section className="mt-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-white/40">
            Players
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => {
              const ps = state?.players[p.id];
              const status = ps?.status ?? "available";
              const isCurrent = current?.playerId === p.id;
              const soldTeam =
                ps?.soldToTeamId &&
                teams.find((t) => t.id === ps.soldToTeamId)?.shortName;
              return (
                <button
                  key={p.id}
                  onClick={() => run({ type: "SELECT_PLAYER", playerId: p.id })}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                    isCurrent
                      ? "border-gold bg-gold/10"
                      : "border-white/10 bg-navy-light/40 hover:border-white/25"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-white/40">{p.role}</p>
                  </div>
                  <StatusPill
                    status={status}
                    soldTeam={soldTeam}
                    price={ps?.soldPrice}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* Purse board */}
        <section className="mt-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-white/40">
            Team Purses
          </p>
          <TeamBalances
            state={state}
            teams={teams}
            budget={budget}
            highlightTeamId={current?.leadingTeamId}
          />
        </section>

        {/* Danger zone */}
        <section className="mt-10 flex justify-center">
          <button
            onClick={() => {
              if (confirm("Reset the ENTIRE auction? All sales and purses are wiped."))
                run({ type: "RESET_ALL" });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400/80 transition-colors hover:bg-red-500/10"
          >
            <RotateCcw className="size-3.5" /> Reset Auction
          </button>
        </section>
      </div>
    </main>
  );
}

function LeadLabel({
  state,
  meta,
}: {
  state: AuctionState | null;
  meta: AuctionMeta;
}) {
  const id = state?.current?.leadingTeamId;
  if (!id) return <p className="text-xs text-white/40">Awaiting first bid</p>;
  const team = meta.teams.find((t) => t.id === id);
  return (
    <p className="text-xs font-semibold" style={{ color: team?.primary }}>
      {team?.name}
    </p>
  );
}

function StatusPill({
  status,
  soldTeam,
  price,
}: {
  status: "available" | "sold" | "unsold";
  soldTeam?: string | false;
  price?: number;
}) {
  if (status === "sold") {
    return (
      <span className="shrink-0 rounded-full bg-green-500/15 px-2.5 py-1 text-[10px] font-bold text-green-300">
        {soldTeam} · {price ? formatAmount(price) : ""}
      </span>
    );
  }
  if (status === "unsold") {
    return (
      <span className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold text-red-300">
        Unsold
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/50">
      Available
    </span>
  );
}
