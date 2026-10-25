import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../api";
import type { Filters, Vehicle, VehicleInput } from "../types";
import { emptyFilters } from "../components/InventoryFilters";
import type { VehicleAction } from "../components/VehicleDialog";

/** Owns inventory fetching, request cancellation, and serialized stock mutations. */
export function useInventory(token: string) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters });
  const appliedFilters = useRef<Filters>({ ...emptyFilters });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false),
    alive = useRef(true),
    latestRequest = useRef(0);
  const request = useRef<AbortController | null>(null);
  const [action, setAction] = useState<VehicleAction | null>(null);
  const [dialogError, setDialogError] = useState("");
  const load = useCallback(
    async (selected: Filters) => {
      const serial = ++latestRequest.current;
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      setLoading(true);
      setError("");
      const query = new URLSearchParams(
        Object.entries(selected)
          .filter(([, v]) => v.trim() !== "")
          .map(([k, v]) => [k, v.trim()]),
      );
      try {
        const result = await apiRequest<Vehicle[]>(
          query.size ? `/vehicles/search?${query}` : "/vehicles",
          token,
          { signal: controller.signal },
        );
        if (alive.current && serial === latestRequest.current)
          setVehicles(result);
      } catch (err) {
        if (
          !controller.signal.aborted &&
          alive.current &&
          serial === latestRequest.current
        ) {
          setVehicles([]);
          setError(
            err instanceof Error ? err.message : "Unable to load inventory.",
          );
        }
      } finally {
        if (alive.current && serial === latestRequest.current)
          setLoading(false);
      }
    },
    [token],
  );
  useEffect(() => {
    alive.current = true;
    void load(appliedFilters.current);
    return () => {
      alive.current = false;
      request.current?.abort();
    };
  }, [load]);
  async function mutate(
    path: string,
    method: string,
    data: unknown,
    message: string,
    inDialog = false,
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setDialogError("");
    setNotice("");
    try {
      await apiRequest(path, token, {
        method,
        ...(data !== null ? { body: JSON.stringify(data) } : {}),
      });
      if (!alive.current) return;
      setNotice(message);
      setAction(null);
      await load(appliedFilters.current);
    } catch (err) {
      if (alive.current)
        (inDialog ? setDialogError : setError)(
          err instanceof Error
            ? err.message
            : "Update failed. Please try again.",
        );
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  function submitAction(data: VehicleInput | { quantity: number } | null) {
    if (!action) return;
    if (action.type === "create")
      void mutate(
        "/vehicles",
        "POST",
        data,
        "Vehicle added to your inventory.",
        true,
      );
    else
      void mutate(
        `/vehicles/${action.vehicle.id}${action.type === "restock" ? "/restock" : ""}`,
        action.type === "delete"
          ? "DELETE"
          : action.type === "restock"
            ? "POST"
            : "PUT",
        data,
        action.type === "delete" ? "Vehicle removed." : "Inventory updated.",
        true,
      );
  }
  function openAction(next: VehicleAction) {
    setDialogError("");
    setAction(next);
  }
  function closeAction() {
    if (!lock.current) setAction(null);
  }
  return {
    vehicles,
    filters,
    setFilters,
    appliedFilters,
    loading,
    error,
    notice,
    busy,
    action,
    dialogError,
    load,
    mutate,
    submitAction,
    openAction,
    closeAction,
  };
}
