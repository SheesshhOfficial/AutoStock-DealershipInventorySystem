import type { User } from "../types";
import { useInventory } from "../hooks/useInventory";
import { VehicleCard } from "./VehicleCard";
import { InventoryFilters } from "./InventoryFilters";
import { VehicleDialog } from "./VehicleDialog";
export function InventoryWorkspace({
  token,
  user,
  onLogout,
}: {
  token: string;
  user: User;
  onLogout: () => void;
}) {
  const admin = user.role === "admin";
  const {
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
  } = useInventory(token);
  return (
    <div className="workspace">
      <aside className="sidebar">
        <a className="brand" href="/">
          a
          <span>
            AutoStock<span className="brand-dot">.</span>
          </span>
        </a>
        <p className="nav-label">WORKSPACE</p>
        <div className="nav-item">
          <span aria-hidden="true">▦</span> Vehicle inventory{" "}
          <span className="nav-indicator" />
        </div>
        <div className="sidebar-note">
          <span className="note-icon">↗</span>
          <h3>Keep things moving.</h3>
          <p>
            Every vehicle. Every update.
            <br />
            One clear view.
          </p>
        </div>
        <div className="sidebar-bottom">
          <span className="avatar">{user.email.charAt(0).toUpperCase()}</span>
          <div>
            <strong>{admin ? "Administrator" : "Customer"}</strong>
            <p title={user.email}>{user.email}</p>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <p>
            Workspace <span>/</span> <strong>Inventory</strong>
          </p>
          <div className="flex items-center gap-4">
            <span className="role-badge">
              {admin ? "Admin access" : "Customer access"}
            </span>
            <button className="text-button" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </header>
        <main className="dashboard">
          <div className="page-heading">
            <div>
              <p className="eyebrow">THE RIGHT CARS. ALL IN ONE PLACE.</p>
              <h1>
                Vehicle inventory<span>.</span>
              </h1>
              <p className="muted">
                Explore your lineup. Find the right fit. Keep moving.
              </p>
            </div>
            {admin && (
              <button
                className="primary"
                disabled={busy}
                onClick={() => openAction({ type: "create" })}
              >
                ＋ Add vehicle
              </button>
            )}
          </div>
          <section className="stats" aria-label="Inventory summary">
            <div>
              <span>Vehicle listings</span>
              <strong>
                {loading ? "—" : vehicles.length}
                <small>models in this view</small>
              </strong>
            </div>
            <div>
              <span>Units in stock</span>
              <strong>
                {loading
                  ? "—"
                  : vehicles.reduce((sum, v) => sum + v.quantity, 0)}
                <small>ready for the road</small>
              </strong>
            </div>
            <div>
              <span>Available models</span>
              <strong>
                {loading ? "—" : vehicles.filter((v) => v.quantity > 0).length}
                <small>with stock available</small>
              </strong>
            </div>
          </section>
          <InventoryFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => {
              const cleared = { make: "", model: "", category: "", min_price: "", max_price: "" };
              setFilters(cleared);
              appliedFilters.current = cleared;
              void load(cleared);
            }}
            busy={loading || busy}
            onSearch={() => {
              appliedFilters.current = { ...filters };
              void load(filters);
            }}
          />
          {notice && (
            <p className="success my-4" role="status">
              ✓ {notice}
            </p>
          )}
          {error && (
            <div className="error my-4" role="alert">
              {error}{" "}
              <button
                className="text-button"
                onClick={() => void load(appliedFilters.current)}
              >
                Retry
              </button>
            </div>
          )}
          <div className="results-heading">
            <h2>
              Your lineup <span>{vehicles.length}</span>
            </h2>
            <p>
              {Object.values(appliedFilters.current).some(Boolean)
                ? "Filtered inventory"
                : "All vehicles"}{" "}
              · Prices in INR
            </p>
          </div>
          {loading ? (
            <div className="empty-state" role="status">
              Loading your inventory…
            </div>
          ) : !vehicles.length ? (
            <div className="empty-state">
              <span aria-hidden="true">⌕</span>
              <h3>{error ? "Inventory unavailable" : "No vehicles to show"}</h3>
              <p>
                {error
                  ? "Try again when your connection is restored."
                  : "Try another search or clear your filters."}
              </p>
              {admin && !error && (
                <button
                  className="text-button mt-3"
                  onClick={() => openAction({ type: "create" })}
                >
                  Add your first vehicle →
                </button>
              )}
            </div>
          ) : (
            <section className="vehicle-grid" aria-label="Vehicles">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  admin={admin}
                  busy={busy}
                  onPurchase={(v) =>
                    void mutate(
                      `/vehicles/${v.id}/purchase`,
                      "POST",
                      null,
                      `${v.make} ${v.model} purchased. Stock updated.`,
                    )
                  }
                  onEdit={(v) => openAction({ type: "edit", vehicle: v })}
                  onRestock={(v) => openAction({ type: "restock", vehicle: v })}
                  onDelete={(v) => openAction({ type: "delete", vehicle: v })}
                />
              ))}
            </section>
          )}
          <footer className="dashboard-footer">
            <span>AutoStock / A clearer road ahead.</span>
            <span>Inventory is updated after every transaction.</span>
          </footer>
        </main>
      </div>
      {action && (
        <VehicleDialog
          action={action}
          busy={busy}
          error={dialogError}
          onClose={closeAction}
          onSubmit={submitAction}
        />
      )}
    </div>
  );
}
