import type { Vehicle } from "../types";
import { CarIllustration } from "./CarIllustration";
interface Props {
  vehicle: Vehicle;
  admin: boolean;
  busy: boolean;
  onPurchase: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onRestock: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}
export const formatPrice = (price: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price));
export function VehicleCard({
  vehicle,
  admin,
  busy,
  onPurchase,
  onEdit,
  onRestock,
  onDelete,
}: Props) {
  const colors = ["#6c8381", "#7c849b", "#ae9a85", "#748797", "#92958a"];
  return (
    <article className="vehicle-card">
      <div className="vehicle-art">
        <span className="category-tag">{vehicle.category}</span>
        <span
          className={`stock-dot ${vehicle.quantity ? "" : "empty"}`}
          title={vehicle.quantity ? "In stock" : "Out of stock"}
        />
        <CarIllustration
          category={vehicle.category}
          color={colors[vehicle.id % colors.length]}
        />
        <span className="art-label">MODEL ILLUSTRATION</span>
      </div>
      <div className="vehicle-body">
        <p className="make-label">{vehicle.make}</p>
        <h3>{vehicle.model}</h3>
        <div className="vehicle-meta">
          <strong>{formatPrice(vehicle.price)}</strong>
          <span className={vehicle.quantity ? "stock-label" : "muted"}>
            {vehicle.quantity ? `${vehicle.quantity} in stock` : "Unavailable"}
          </span>
        </div>
        <button
          className="purchase"
          disabled={busy || vehicle.quantity === 0}
          onClick={() => onPurchase(vehicle)}
        >
          {vehicle.quantity === 0
            ? "Out of stock"
            : busy
              ? "Updating…"
              : "Purchase vehicle"}
          {vehicle.quantity > 0 && <span aria-hidden="true">↗</span>}
        </button>
        {admin && (
          <div className="admin-actions">
            <button disabled={busy} onClick={() => onEdit(vehicle)}>
              Edit
            </button>
            <button disabled={busy} onClick={() => onRestock(vehicle)}>
              Restock
            </button>
            <button
              disabled={busy}
              className="danger-text"
              onClick={() => onDelete(vehicle)}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
