export interface User {
  id: number;
  email: string;
  role: "admin" | "customer" | "user";
}
export interface Vehicle {
  id: number;
  make: string;
  model: string;
  category: string;
  price: string;
  quantity: number;
}
export type VehicleInput = Omit<Vehicle, "id">;
export interface Session {
  access_token: string;
  token_type: string;
  user: User;
}
export interface Filters {
  make: string;
  model: string;
  category: string;
  min_price: string;
  max_price: string;
}
