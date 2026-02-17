import { Product, Order, DiscountCode, TrackingEvent, OrderStatus, OrderItem } from "./types";
import { initialProducts, seedOrders } from "./mock-data";

// In-memory database singleton (persists across API requests in the same server process)
class Database {
  products: Product[];
  orders: Order[];
  discounts: DiscountCode[];
  private orderCounter: number;

  constructor() {
    this.products = JSON.parse(JSON.stringify(initialProducts));
    this.orders = JSON.parse(JSON.stringify(seedOrders));
    this.discounts = [];
    this.orderCounter = 1004;
  }

  // ── Products ──────────────────────────────────────────
  getProducts(): Product[] {
    return this.products;
  }

  getProduct(sku: string): Product | undefined {
    return this.products.find((p) => p.sku === sku);
  }

  checkStock(sku: string, quantity: number): boolean {
    const product = this.getProduct(sku);
    return product ? product.stock >= quantity : false;
  }

  decrementStock(sku: string, quantity: number): boolean {
    const product = this.getProduct(sku);
    if (!product || product.stock < quantity) return false;
    product.stock -= quantity;
    return true;
  }

  // ── Orders ────────────────────────────────────────────
  getOrders(): Order[] {
    return this.orders;
  }

  getOrder(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id);
  }

  getOrdersByEmail(email: string): Order[] {
    return this.orders.filter((o) => o.email.toLowerCase() === email.toLowerCase());
  }

  createOrder(customerName: string, email: string, items: OrderItem[]): Order | null {
    // Validate stock for all items
    for (const item of items) {
      if (!this.checkStock(item.sku, item.quantity)) return null;
    }

    // Decrement stock
    for (const item of items) {
      this.decrementStock(item.sku, item.quantity);
    }

    const now = new Date().toISOString();
    const order: Order = {
      id: `ORD-${this.orderCounter++}`,
      customerName,
      email,
      items,
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      status: "pending",
      createdAt: now,
      updatedAt: now,
      trackingEvents: [
        {
          status: "pending",
          timestamp: now,
          location: "Online",
          description: "Order placed successfully",
        },
      ],
    };
    this.orders.push(order);
    return order;
  }

  updateOrderStatus(id: string, status: OrderStatus, location: string, description: string): Order | null {
    const order = this.getOrder(id);
    if (!order) return null;

    const now = new Date().toISOString();
    order.status = status;
    order.updatedAt = now;

    if (status === "shipped" && !order.trackingNumber) {
      order.trackingNumber = `TRK-${Date.now().toString().slice(-7)}`;
    }

    const event: TrackingEvent = { status, timestamp: now, location, description };
    order.trackingEvents.push(event);
    return order;
  }

  // Advance an order to the next delivery stage
  advanceOrder(id: string): Order | null {
    const order = this.getOrder(id);
    if (!order) return null;

    const progression: { status: OrderStatus; location: string; description: string }[] = [
      { status: "processing", location: "Contoso Warehouse, Redmond WA", description: "Order confirmed and being prepared" },
      { status: "shipped", location: "Redmond WA", description: "Package picked up by carrier" },
      { status: "out_for_delivery", location: "Local Distribution Center", description: "Out for delivery" },
      { status: "delivered", location: "Customer Address", description: "Package delivered successfully" },
    ];

    const currentIndex = progression.findIndex((p) => p.status === order.status);
    const nextStep = currentIndex === -1 ? progression[0] : progression[currentIndex + 1];
    if (!nextStep) return order; // Already delivered

    return this.updateOrderStatus(id, nextStep.status, nextStep.location, nextStep.description);
  }

  // ── Discounts ─────────────────────────────────────────
  applyDiscount(orderId: string, percentage: number = 20): DiscountCode {
    const code = `CONTOSO${percentage}-${Date.now().toString().slice(-5)}`;
    const discount: DiscountCode = {
      code,
      percentage,
      orderId,
      createdAt: new Date().toISOString(),
    };
    this.discounts.push(discount);

    const order = this.getOrder(orderId);
    if (order) order.discountCode = code;

    return discount;
  }

  // ── Replacement ───────────────────────────────────────
  triggerReplacement(orderId: string): { success: boolean; newOrderId?: string; trackingNumber?: string; lowStockAlerts?: Product[]; error?: string } {
    const order = this.getOrder(orderId);
    if (!order) return { success: false, error: "Order not found" };

    // Check stock for all items in the original order
    const lowStockAlerts: Product[] = [];
    for (const item of order.items) {
      if (!this.checkStock(item.sku, item.quantity)) {
        return { success: false, error: `Insufficient stock for ${item.name} (SKU: ${item.sku})` };
      }
    }

    // Decrement stock and check for low-stock alerts
    for (const item of order.items) {
      this.decrementStock(item.sku, item.quantity);
      const product = this.getProduct(item.sku);
      if (product && product.stock < 5) {
        lowStockAlerts.push(product);
      }
    }

    // Mark original order as replacement_sent
    this.updateOrderStatus(orderId, "replacement_sent", "Contoso HQ", "Replacement order initiated");

    // Create a new replacement order
    const now = new Date().toISOString();
    const newOrderId = `ORD-${this.orderCounter++}`;
    const trackingNumber = `TRK-RPL-${Date.now().toString().slice(-7)}`;
    const replacementOrder: Order = {
      id: newOrderId,
      customerName: order.customerName,
      email: order.email,
      items: order.items,
      total: 0, // Replacement is free
      status: "processing",
      createdAt: now,
      updatedAt: now,
      trackingNumber,
      trackingEvents: [
        { status: "pending", timestamp: now, location: "Online", description: "Replacement order created" },
        { status: "processing", timestamp: now, location: "Contoso Warehouse, Redmond WA", description: "Replacement being prepared" },
      ],
    };
    this.orders.push(replacementOrder);

    return { success: true, newOrderId, trackingNumber, lowStockAlerts };
  }

  // ── Low Stock Check ───────────────────────────────────
  getLowStockProducts(threshold: number = 5): Product[] {
    return this.products.filter((p) => p.stock > 0 && p.stock < threshold);
  }

  getOutOfStockProducts(): Product[] {
    return this.products.filter((p) => p.stock === 0);
  }
}

// Singleton — shared across all API routes
const globalForDb = globalThis as unknown as { db: Database };
export const db = globalForDb.db || new Database();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
