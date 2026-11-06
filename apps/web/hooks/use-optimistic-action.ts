"use client";

import { useState, useTransition, useCallback } from "react";

export interface OptimisticListOptions<T> {
  onSuccess?: (action: "remove" | "update" | "add", item?: T) => void;
  onError?: (error: Error, action: "remove" | "update" | "add") => void;
}

export function useOptimisticList<T extends { id: string }>(
  initialItems: T[],
  options: OptimisticListOptions<T> = {}
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const removeOptimistic = useCallback(
    async (id: string, asyncAction: () => Promise<void>) => {
      // Snapshot previous state for rollback
      const previousItems = items;
      setError(null);

      // Optimistic update: remove immediately
      setItems((prev) => prev.filter((item) => item.id !== id));

      startTransition(async () => {
        try {
          await asyncAction();
          options.onSuccess?.("remove");
        } catch (err) {
          // Rollback on failure
          setItems(previousItems);
          const message = err instanceof Error ? err.message : "Failed to delete item.";
          setError(message);
          options.onError?.(err instanceof Error ? err : new Error(message), "remove");
        }
      });
    },
    [items, options]
  );

  const updateOptimistic = useCallback(
    async (id: string, patch: Partial<T>, asyncAction: () => Promise<void>) => {
      const previousItems = items;
      setError(null);

      // Optimistic update: apply patch immediately
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );

      startTransition(async () => {
        try {
          await asyncAction();
          options.onSuccess?.("update");
        } catch (err) {
          // Rollback on failure
          setItems(previousItems);
          const message = err instanceof Error ? err.message : "Failed to update item.";
          setError(message);
          options.onError?.(err instanceof Error ? err : new Error(message), "update");
        }
      });
    },
    [items, options]
  );

  const addOptimistic = useCallback(
    async (tempItem: T, asyncAction: () => Promise<T>) => {
      const previousItems = items;
      setError(null);

      // Optimistic update: prepend temp item immediately
      setItems((prev) => [tempItem, ...prev]);

      startTransition(async () => {
        try {
          const created = await asyncAction();
          setItems((prev) =>
            prev.map((item) => (item.id === tempItem.id ? created : item))
          );
          options.onSuccess?.("add", created);
        } catch (err) {
          // Rollback on failure
          setItems(previousItems);
          const message = err instanceof Error ? err.message : "Failed to add item.";
          setError(message);
          options.onError?.(err instanceof Error ? err : new Error(message), "add");
        }
      });
    },
    [items, options]
  );

  const resetItems = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    items,
    isPending,
    error,
    removeOptimistic,
    updateOptimistic,
    addOptimistic,
    setItems: resetItems,
    clearError,
  };
}
