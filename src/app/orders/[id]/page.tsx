"use client";

import { useState, useEffect, use } from "react";
import { StoreProvider } from "@/lib/store";
import { Order } from "@/lib/types";
import Navbar from "@/components/Navbar";
import ChatSidebar from "@/components/ChatSidebar";
import DeliveryTimeline from "@/components/DeliveryTimeline";
import Link from "next/link";

function OrderDetailContent({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = () => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Order not found");
        return r.json();
      })
      .then(setOrder)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
    // Poll for status updates every 10 seconds
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="h-96 animate-pulse rounded-2xl bg-neutral-200" />
        </main>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-5xl mb-4">❌</p>
          <p className="text-lg font-medium text-neutral-600">{error || "Order not found"}</p>
          <Link href="/orders" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            ← Back to Orders
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/orders" className="text-sm text-blue-600 hover:underline">
          ← Back to Orders
        </Link>

        {/* Order Header */}
        <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/60">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">{order.id}</h1>
              <p className="text-sm text-neutral-500">
                Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                order.status === "delivered"
                  ? "bg-emerald-100 text-emerald-800"
                  : order.status === "shipped" || order.status === "out_for_delivery"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-amber-100 text-amber-800"
              }`}
            >
              {order.status.replace(/_/g, " ")}
            </span>
          </div>

          {order.trackingNumber && (
            <div className="mt-3 rounded-lg bg-neutral-50 px-4 py-2.5">
              <p className="text-xs text-neutral-500">Tracking Number</p>
              <p className="font-mono text-sm font-semibold text-neutral-900">
                {order.trackingNumber}
              </p>
            </div>
          )}

          {order.discountCode && (
            <div className="mt-3 rounded-lg bg-purple-50 border border-purple-200 px-4 py-2.5">
              <p className="text-xs text-purple-600">Discount Applied</p>
              <p className="font-mono text-sm font-semibold text-purple-800">
                🎟️ {order.discountCode}
              </p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/60">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.sku}
                className="flex items-center gap-4 rounded-xl bg-neutral-50 p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-xl">
                  📦
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                  <p className="text-xs text-neutral-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-neutral-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-neutral-100 pt-4">
            <span className="text-sm font-medium text-neutral-500">Total</span>
            <span className="text-lg font-bold text-neutral-900">${order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Delivery Timeline */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/60">
          <h2 className="text-sm font-semibold text-neutral-900 mb-6">Delivery Progress</h2>
          <DeliveryTimeline events={order.trackingEvents} currentStatus={order.status} />
        </div>

        {/* Customer Info */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/60">
          <h2 className="text-sm font-semibold text-neutral-900 mb-3">Customer</h2>
          <p className="text-sm text-neutral-700">{order.customerName}</p>
          <p className="text-sm text-neutral-500">{order.email}</p>
        </div>
      </main>
      <ChatSidebar />
    </>
  );
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <StoreProvider>
      <OrderDetailContent orderId={id} />
    </StoreProvider>
  );
}
