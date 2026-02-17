export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "refunded"
  | "replacement_sent";

export interface Order {
  id: string;
  customerName: string;
  email: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  trackingEvents: TrackingEvent[];
  discountCode?: string;
}

export interface OrderItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Product {
  sku: string;
  name: string;
  description: string;
  stock: number;
  price: number;
  image: string;
  category: string;
}

export interface TrackingEvent {
  status: OrderStatus;
  timestamp: string;
  location: string;
  description: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DiscountCode {
  code: string;
  percentage: number;
  orderId: string;
  createdAt: string;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export type AgentType = "consumer" | "ops" | "router" | null;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agent?: AgentType;
  timestamp: string;
}
