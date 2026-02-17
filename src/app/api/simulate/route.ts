import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/simulate — agent actions and delivery simulation
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, orderId } = body;

  // ── Advance single order ─────────────────────────────
  if (action === "advance" && orderId) {
    const order = db.advanceOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  }

  // ── Advance all orders ───────────────────────────────
  if (action === "advance-all") {
    const orders = db.getOrders();
    const advanced = orders
      .filter((o) => o.status !== "delivered" && o.status !== "refunded" && o.status !== "replacement_sent")
      .map((o) => db.advanceOrder(o.id))
      .filter(Boolean);
    return NextResponse.json({ advanced: advanced.length, orders: advanced });
  }

  // ── Apply discount (Support Agent) ───────────────────
  if (action === "apply-discount") {
    const { orderId: discountOrderId, percentage } = body;
    if (!discountOrderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }
    const order = db.getOrder(discountOrderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const discount = db.applyDiscount(discountOrderId, percentage || 20);
    return NextResponse.json({
      success: true,
      discountCode: discount.code,
      percentage: discount.percentage,
      orderId: discountOrderId,
      customerName: order.customerName,
    });
  }

  // ── Trigger replacement (Ops Agent) ──────────────────
  if (action === "trigger-replacement") {
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }
    const result = db.triggerReplacement(orderId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      originalOrderId: orderId,
      newOrderId: result.newOrderId,
      trackingNumber: result.trackingNumber,
      lowStockAlerts: result.lowStockAlerts?.map((p) => ({
        sku: p.sku,
        name: p.name,
        remainingStock: p.stock,
      })),
    });
  }

  // ── Check stock for a specific product (Ops Agent) ───
  if (action === "check-stock") {
    const { sku } = body;
    if (!sku) {
      return NextResponse.json({ error: "Missing sku" }, { status: 400 });
    }
    const product = db.getProduct(sku);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({
      sku: product.sku,
      name: product.name,
      stock: product.stock,
      isInStock: product.stock > 0,
      isLowStock: product.stock > 0 && product.stock < 5,
      price: product.price,
    });
  }

  // ── Get low stock alerts ─────────────────────────────
  if (action === "low-stock-alert") {
    const threshold = body.threshold || 5;
    const lowStock = db.getLowStockProducts(threshold);
    const outOfStock = db.getOutOfStockProducts();
    return NextResponse.json({
      lowStock: lowStock.map((p) => ({ sku: p.sku, name: p.name, stock: p.stock })),
      outOfStock: outOfStock.map((p) => ({ sku: p.sku, name: p.name })),
      alertNeeded: lowStock.length > 0 || outOfStock.length > 0,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// GET /api/simulate — health check for agent flows
export async function GET() {
  return NextResponse.json({ status: "ok", actions: [
    "advance", "advance-all", "apply-discount", "trigger-replacement",
    "check-stock", "low-stock-alert",
  ]});
}
