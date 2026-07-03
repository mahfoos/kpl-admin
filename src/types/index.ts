export type PlayerRole =
  | "Batsman"
  | "Bowler"
  | "All-Rounder"
  | "Wicket Keeper";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  city: string;
  primary: string;
  secondary: string;
  initials: string;
  squadStatus: string;
  auctionStatus: string;
}

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  battingStyle: string;
  bowlingStyle?: string;
  basePrice: string;
  /** Numeric base price in LKR used by the live auction. Defaults to DEFAULT_BASE_PRICE. */
  basePriceValue?: number;
  status: string;
  /** Optional promo card image under /public, e.g. "/auction/rijas.jpg" */
  image?: string;
  /** Player's home club, e.g. "Kins National". Used to group the picker by team. */
  club?: string;
}

// ----- Live auction state -----

/** Status of the lot currently on the auction block. */
export type LotStatus = "idle" | "live" | "sold" | "unsold";

/** Per-team purse tracking for the live auction. */
export interface AuctionTeamState {
  spent: number;
  playerIds: string[];
}

/** Per-player outcome tracking for the live auction. */
export interface AuctionPlayerState {
  status: "available" | "sold" | "unsold";
  soldToTeamId?: string;
  soldPrice?: number;
}

/** The player presently being auctioned. */
export interface CurrentLot {
  playerId: string;
  bid: number;
  /** Team currently winning the bid, or null before the first bid. */
  leadingTeamId: string | null;
  status: LotStatus;
  /** Stack of prior (bid, leadingTeamId) pairs for UNDO within this lot. */
  raises: { bid: number; leadingTeamId: string | null }[];
}

/** Full snapshot broadcast to every screen. */
export interface AuctionState {
  /** Monotonically increasing; bumps on every mutation. */
  version: number;
  current: CurrentLot | null;
  teams: Record<string, AuctionTeamState>;
  players: Record<string, AuctionPlayerState>;
  /** Human-readable banner of the most recent action, for the screen. */
  lastEvent: string | null;
}

export type AuctionActionType =
  | "SELECT_PLAYER"
  | "RAISE"
  | "UNDO"
  | "SOLD"
  | "UNSOLD"
  | "CLEAR"
  | "RESET_ALL";

export interface AuctionAction {
  type: AuctionActionType;
  playerId?: string;
  teamId?: string;
  amount?: number;
}

/** Static roster + tuning served by the screen app. */
export interface AuctionMeta {
  teams: Team[];
  players: Player[];
  budget: number;
  baseDefault: number;
  steps: number[];
}
