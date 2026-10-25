import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InventoryWorkspace } from "./InventoryWorkspace";

const toyota = { id: 1, make: "Toyota", model: "Corolla", category: "Sedan", price: "100.00", quantity: 1 };
const honda = { id: 2, make: "Honda", model: "City", category: "Sedan", price: "120.00", quantity: 0 };
const user = { id: 1, email: "customer@example.com", role: "customer" as const };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("clears applied filters and restores all vehicles", async () => {
  const fetchMock = vi.fn(async (url: string) => ({
    ok: true,
    status: 200,
    json: async () => url.includes("/search") ? [toyota] : [toyota, honda],
  }));
  vi.stubGlobal("fetch", fetchMock);
  render(<InventoryWorkspace token="token" user={user} onLogout={() => {}} />);
  await screen.findByText("City");
  const actor = userEvent.setup();
  await actor.type(screen.getByRole("textbox", { name: "Make" }), "Toyota");
  await actor.click(screen.getByRole("button", { name: "Search" }));
  await waitFor(() => expect(screen.queryByText("City")).not.toBeInTheDocument());
  await actor.click(screen.getByRole("button", { name: "Clear filters" }));
  await screen.findByText("City");
  expect(screen.getByRole("textbox", { name: "Make" })).toHaveValue("");
  expect(fetchMock).toHaveBeenLastCalledWith("/api/vehicles", expect.anything());
});

it("does not show old inventory after a failed search", async () => {
  const fetchMock = vi.fn(async (url: string) => url.includes("/search")
    ? { ok: false, status: 503, json: async () => ({ detail: "Unavailable" }) }
    : { ok: true, status: 200, json: async () => [toyota, honda] });
  vi.stubGlobal("fetch", fetchMock);
  render(<InventoryWorkspace token="token" user={user} onLogout={() => {}} />);
  await screen.findByText("City");
  const actor = userEvent.setup();
  await actor.type(screen.getByRole("textbox", { name: "Make" }), "Toyota");
  await actor.click(screen.getByRole("button", { name: "Search" }));
  await screen.findByRole("alert");
  expect(screen.queryByText("City")).not.toBeInTheDocument();
  expect(screen.getByText("Inventory unavailable")).toBeInTheDocument();
});

it("disables purchase for zero stock and refreshes after a successful purchase", async () => {
  let quantity = 1;
  const fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
    if (url.endsWith("/purchase") && options?.method === "POST") {
      quantity -= 1;
      return { ok: true, status: 200, json: async () => ({ ...toyota, quantity }) };
    }
    return { ok: true, status: 200, json: async () => [{ ...toyota, quantity }, honda] };
  });
  vi.stubGlobal("fetch", fetchMock);
  render(<InventoryWorkspace token="token" user={user} onLogout={() => {}} />);
  await screen.findByText("City");
  expect(screen.getByRole("button", { name: "Out of stock" })).toBeDisabled();
  await userEvent.setup().click(screen.getByRole("button", { name: /Purchase vehicle/ }));
  await waitFor(() => expect(screen.getAllByRole("button", { name: "Out of stock" })).toHaveLength(2));
  expect(fetchMock).toHaveBeenCalledWith("/api/vehicles/1/purchase", expect.objectContaining({ method: "POST" }));
});
