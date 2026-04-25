"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { PlaceSuggestionDTO } from "@/lib/duffel/types";

export function PlaceAutocomplete({
  value,
  onSelect,
  placeholder,
}: {
  value: string;
  onSelect: (iata: string, label?: string) => void;
  placeholder?: string;
}) {
  // Initial query mirrors `value`; subsequent controlled-`value` changes are
  // applied inline during render via derived state.
  const [queryState, setQueryState] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setQueryState(value);
  }
  const query = queryState;

  const [suggestions, setSuggestions] = useState<PlaceSuggestionDTO[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      // Clear suggestions without scheduling a fetch
      return;
    }
    let cancelled = false;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
        if (!cancelled && res.ok) {
          const json = (await res.json()) as PlaceSuggestionDTO[];
          setSuggestions(json);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const shortQuery = !query.trim() || query.length < 2;
  const effectiveSuggestions = shortQuery ? [] : suggestions;

  function pick(s: PlaceSuggestionDTO) {
    const label = `${s.iataCode} — ${s.name}`;
    setQueryState(label);
    onSelect(s.iataCode, label);
    setOpen(false);
  }

  return (
    <div ref={box} className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQueryState(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-9"
          autoComplete="off"
        />
      </div>
      {open && (effectiveSuggestions.length > 0 || loading) && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-card shadow-lg">
          {loading && effectiveSuggestions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
          ) : (
            effectiveSuggestions.map((s) => (
              <button
                key={`${s.iataCode}-${s.type}`}
                type="button"
                onClick={() => pick(s)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="mt-0.5 inline-flex h-5 items-center rounded bg-primary/10 px-1.5 text-xs font-semibold text-primary">
                  {s.iataCode}
                </span>
                <span className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {[s.cityName, s.countryName].filter(Boolean).join(", ")}
                    {s.type === "city" && " • City"}
                  </div>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
