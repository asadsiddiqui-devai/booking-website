"use client";

import { useEffect, useRef } from "react";
import { saveTrip, type SavedTrip } from "@/lib/trips-storage";

type Props = Omit<SavedTrip, "id" | "confirmedAt">;

export function SaveTrip(props: Props) {
  const saved = useRef(false);

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    saveTrip(props);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
