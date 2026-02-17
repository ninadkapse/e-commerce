import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (email) {
    return NextResponse.json(db.getOrdersByEmail(email));
  }
  return NextResponse.json(db.getOrders());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customerName, email, items } = body;

  if (!customerName || !email || !items?.length) {
    return NextResponse.json(
      { error: "Missing customerName, email, or items" },
      { status: 400 }
    );
  }

  // Validate stock before placing order
  for (const item of items) {
    if (!db.checkStock(item.sku, item.quantity)) {
      const product = db.getProduct(item.sku);
      return NextResponse.json(
        {
          error: `Insufficient stock for "${item.name}". Available: ${product?.stock ?? 0}, Requested: ${item.quantity}`,
        },
        { status: 409 }
      );
    }
  }

  const order = db.createOrder(customerName, email, items);
  if (!order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  return NextResponse.json(order, { status: 201 });
}
