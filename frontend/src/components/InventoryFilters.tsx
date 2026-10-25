import type { FormEvent } from "react";
import type { Filters } from "../types";
export const emptyFilters: Filters = {
  make: "",
  model: "",
  category: "",
  min_price: "",
  max_price: "",
};
export function InventoryFilters({
  filters,
  onChange,
  onSearch,
  busy,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onSearch: () => void;
  busy: boolean;
}) {
  function submit(event: FormEvent) {
    event.preventDefault();
    onSearch();
  }
  return (
    <form className="filters" onSubmit={submit}>
      <div className="filter-heading">
        <h2>Find your next vehicle</h2>
        <button
          className="text-button"
          type="button"
          onClick={() => onChange({ ...emptyFilters })}
        >
          Clear filters
        </button>
      </div>
      <div className="filter-fields">
        <label>
          Make
          <input
            value={filters.make}
            onChange={(e) => onChange({ ...filters, make: e.target.value })}
            placeholder="e.g. Toyota"
          />
        </label>
        <label>
          Model
          <input
            value={filters.model}
            onChange={(e) => onChange({ ...filters, model: e.target.value })}
            placeholder="e.g. Camry"
          />
        </label>
        <label>
          Category
          <input
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            placeholder="e.g. SUV"
            list="categories"
          />
          <datalist id="categories">
            <option>Sedan</option>
            <option>SUV</option>
            <option>Hatchback</option>
            <option>Truck</option>
            <option>Coupe</option>
          </datalist>
        </label>
        <label>
          Min price (₹)
          <input
            type="number"
            min="0"
            step="0.01"
            value={filters.min_price}
            onChange={(e) =>
              onChange({ ...filters, min_price: e.target.value })
            }
            placeholder="Any"
          />
        </label>
        <label>
          Max price (₹)
          <input
            type="number"
            min={filters.min_price || "0"}
            step="0.01"
            value={filters.max_price}
            onChange={(e) =>
              onChange({ ...filters, max_price: e.target.value })
            }
            placeholder="Any"
          />
        </label>
        <button className="primary" disabled={busy}>
          {busy ? "Searching…" : "Search"}
        </button>
      </div>
    </form>
  );
}
