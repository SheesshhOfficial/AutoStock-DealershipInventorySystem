import { useEffect, useId, useRef, type FormEvent } from "react";
import type { Vehicle, VehicleInput } from "../types";
export type VehicleAction =
  | { type: "create" }
  | { type: "edit" | "restock" | "delete"; vehicle: Vehicle };
export function VehicleDialog({
  action,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  action: VehicleAction;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (data: VehicleInput | { quantity: number } | null) => void;
}) {
  const headingId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const vehicle = "vehicle" in action ? action.vehicle : undefined;
  const editing = action.type === "create" || action.type === "edit";
  const titles = {
    create: "Add a vehicle",
    edit: "Edit vehicle",
    restock: "Restock vehicle",
    delete: "Delete vehicle?",
  };
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    if (action.type === "delete") onSubmit(null);
    else if (action.type === "restock")
      onSubmit({ quantity: Number(data.get("quantity")) });
    else
      onSubmit({
        make: String(data.get("make")).trim(),
        model: String(data.get("model")).trim(),
        category: String(data.get("category")).trim(),
        price: String(data.get("price")),
        quantity: Number(data.get("quantity")),
      });
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby={headingId}
      className="vehicle-dialog"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <form onSubmit={submit}>
        <div className="dialog-heading">
          <h2 id={headingId}>{titles[action.type]}</h2>
          <button
            type="button"
            className="close-button"
            aria-label="Close dialog"
            disabled={busy}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {vehicle && (
          <p className="muted mb-5">
            {vehicle.make} {vehicle.model}
          </p>
        )}
        {action.type === "delete" ? (
          <p className="mb-6">
            This permanently removes the vehicle and its stock record. This
            action cannot be undone.
          </p>
        ) : (
          <div className="space-y-4">
            {editing && (
              <>
                <label>
                  Make
                  <input
                    autoFocus
                    name="make"
                    defaultValue={vehicle?.make}
                    required
                    maxLength={80}
                  />
                </label>
                <label>
                  Model
                  <input
                    name="model"
                    defaultValue={vehicle?.model}
                    required
                    maxLength={80}
                  />
                </label>
                <label>
                  Category
                  <input
                    name="category"
                    defaultValue={vehicle?.category}
                    required
                    maxLength={40}
                  />
                </label>
                <label>
                  Price (₹)
                  <input
                    name="price"
                    type="number"
                    min="0"
                    max="9999999999.99"
                    step="0.01"
                    defaultValue={vehicle?.price}
                    required
                  />
                </label>
              </>
            )}
            <label>
              {editing ? "Quantity in stock" : "Quantity to add"}
              <input
                autoFocus={!editing}
                name="quantity"
                readOnly={action.type === "edit"}
                aria-describedby={
                  action.type === "edit" ? "stock-help" : undefined
                }
                type="number"
                min={editing ? 0 : 1}
                max="1000000"
                step="1"
                defaultValue={editing ? (vehicle?.quantity ?? 0) : 1}
                required
              />
            </label>
            {action.type === "edit" && (
              <p id="stock-help" className="muted">
                Stock is read-only. Use Restock to add stock. If stock changes
                while editing, cancel and refresh before trying again.
              </p>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="error mt-4">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={action.type === "delete" ? "danger" : "primary"}
            disabled={busy}
          >
            {busy
              ? "Saving…"
              : action.type === "delete"
                ? "Delete vehicle"
                : action.type === "restock"
                  ? "Add stock"
                  : "Save vehicle"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
