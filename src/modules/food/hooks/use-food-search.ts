"use client";

import { useState, useEffect, useRef } from "react";
import { searchFood } from "../actions";
import type { FoodProduct } from "@/server/db/schema";

const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

export function useFoodSearch(query: string, enabled = true) {
  const [isSearching, setIsSearching] = useState(false);
  const [localResults, setLocalResults] = useState<FoodProduct[]>([]);
  const searchVersion = useRef(0);

  useEffect(() => {
    if (!enabled || !query.trim() || query.length < MIN_SEARCH_LENGTH) {
      setLocalResults([]);
      return;
    }

    const version = ++searchVersion.current;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const result = await searchFood(query);
      if (version === searchVersion.current) {
        if (result.ok) {
          setLocalResults(result.data.local);
        }
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, enabled]);

  const reset = () => {
    setLocalResults([]);
  };

  return { isSearching, localResults, reset };
}
