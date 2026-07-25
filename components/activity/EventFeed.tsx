"use client";

import { useState, useEffect, useRef } from "react";
import {
  Zap, Heart, ArrowUpRight, RotateCcw, Loader2, Activity,
  Filter, Circle,
} from "lucide-react";
import { cn, shortAddress, formatXlm, formatRelativeTime, explorerTxUrl } from "@/lib/utils";
import { useEvents } from "@/hooks/useEvents";
import { useEventStore } from "@/store/event-store";
import { EVENT_POLL_INTERVAL } from "@/lib/stellar/config";
import type { ContractEvent, EventType } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Event Configuration
// ──────────────────────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<
  ContractEvent["type"],
  { label: string; icon: typeof Heart; color: string; bg: string }
> = {
  campaign_created: {
    label: "Stream Created",
    icon: Zap,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  donation_made: {
    label: "Stream Funded",
    icon: Heart,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  funds_withdrawn: {
    label: "Vested Claimed",
    icon: ArrowUpRight,
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  refund_issued: {
    label: "Stream Refunded",
    icon: RotateCcw,
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
  },
};

// Filter options
type FilterType = "all" | EventType;

const FILTERS: { value: FilterType; label: string; color: string }[] = [
  { value: "all",              label: "All",        color: "text-slate-900" },
  { value: "campaign_created", label: "Streams",    color: "text-blue-700" },
  { value: "donation_made",    label: "Funding",    color: "text-amber-700" },
  { value: "funds_withdrawn",  label: "Claims",     color: "text-emerald-700" },
  { value: "refund_issued",    label: "Refunds",    color: "text-purple-700" },
];

// ──────────────────────────────────────────────────────────────────────────────
// Live Countdown indicator
// ──────────────────────────────────────────────────────────────────────────────

function LiveCountdown() {
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / EVENT_POLL_INTERVAL) * 100);
      setProgress(pct);
      if (pct <= 0) {
        startRef.current = Date.now();
        setProgress(100);
      }
    }, 200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const circumference = 2 * Math.PI * 9; // r=9
  const dash = (progress / 100) * circumference;

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="rotate-[-90deg]">
      <circle cx="12" cy="12" r="9" fill="none" stroke="#E2E8F0" strokeWidth="2" />
      <circle
        cx="12" cy="12" r="9" fill="none"
        stroke="#2563EB" strokeWidth="2"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.2s linear" }}
      />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Event Feed Component
// ──────────────────────────────────────────────────────────────────────────────

interface EventFeedProps {
  limit?: number;
  showHeader?: boolean;
}

export function EventFeed({ limit, showHeader = true }: EventFeedProps) {
  const { events: storeEvents } = useEventStore();
  const { events: queryEvents, isLoading, isPolling, refetch } = useEvents();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Use store events (deduped & sorted) if available, otherwise query results
  const allEvents = storeEvents.length > 0 ? storeEvents : queryEvents;

  // Apply filter
  const filteredEvents = activeFilter === "all"
    ? allEvents
    : allEvents.filter((e) => e.type === activeFilter);

  const displayEvents = limit ? filteredEvents.slice(0, limit) : filteredEvents;

  return (
    <div className="flex flex-col gap-4">
      {showHeader && (
        <div className="space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h2 className="font-extrabold text-lg text-slate-900">Activity Feed</h2>

              {/* Live streaming indicator */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
                <div className={cn("w-2 h-2 rounded-full bg-blue-600", isPolling && "animate-pulse")} />
                <span className="text-xs text-blue-700 font-bold">Live</span>
                {isPolling && <LiveCountdown />}
              </div>
            </div>

            <button
              onClick={() => refetch()}
              className="btn-ghost text-xs py-1.5 px-3"
              aria-label="Refresh events"
            >
              {isPolling
                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                : <Activity className="w-3.5 h-3.5 text-blue-600" />
              }
              Refresh
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            {FILTERS.map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => setActiveFilter(value)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all shadow-sm",
                  activeFilter === value
                    ? "bg-blue-50 border-blue-200 text-blue-700 font-bold"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                )}
              >
                {label}
                {value !== "all" && (
                  <span className="ml-1.5 text-[10px] opacity-70">
                    {allEvents.filter((e) => e.type === value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && displayEvents.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && displayEvents.length === 0 && (
        <div className="glass-card px-6 py-12 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Activity className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="font-bold text-slate-900">
              {activeFilter === "all" ? "No events recorded yet" : `No ${activeFilter.replace("_", " ")} events`}
            </p>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {activeFilter === "all"
                ? "On-chain events will stream here automatically when payment streams are created or funded"
                : "Try switching to a different filter"}
            </p>
          </div>
        </div>
      )}

      {/* Events list */}
      {displayEvents.length > 0 && (
        <div className="space-y-2 stagger-children">
          {displayEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Single Event Card
// ──────────────────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: ContractEvent }) {
  const config = EVENT_CONFIG[event.type] || {
    label: event.type,
    icon: Activity,
    color: "text-slate-600",
    bg: "bg-slate-50 border-slate-200",
  };
  const Icon = config.icon;

  return (
    <div className="event-card animate-fade-in">
      {/* Icon */}
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm",
          config.bg
        )}
      >
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full border",
                  config.bg,
                  config.color
                )}
              >
                {config.label}
              </span>
              <span className="text-xs text-slate-400 font-mono font-semibold">
                Stream #{event.campaignId}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-800 font-medium mt-1.5 line-clamp-1">
              {event.description}
            </p>

            {/* Address + Amount */}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs font-mono text-slate-500">
                {shortAddress(event.walletAddress, 4)}
              </span>
              {event.amount !== undefined && (
                <span className={cn("text-xs font-bold font-mono", config.color)}>
                  {formatXlm(event.amount)}
                </span>
              )}
            </div>
          </div>

          {/* Right side: time + explorer */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-xs text-slate-400 font-medium">
              {formatRelativeTime(event.timestamp)}
            </span>
            <a
              href={explorerTxUrl(event.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 font-mono font-semibold transition-colors"
              title={event.txHash}
            >
              {event.txHash.slice(0, 8)}...
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Skeleton
// ──────────────────────────────────────────────────────────────────────────────

function EventCardSkeleton() {
  return (
    <div className="event-card">
      <div className="skeleton w-9 h-9 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="skeleton h-5 w-28 rounded-full" />
          <div className="skeleton h-5 w-20 rounded" />
        </div>
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="flex gap-3">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}
