"use client";

import { useState, useEffect } from "react";
import { StoreProvider } from "@/lib/store";
import { Order } from "@/lib/types";
import Navbar from "@/components/Navbar";
import ChatSidebar from "@/components/ChatSidebar";
import Link from "next/link";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-emerald-100 text-emerald-800",
  refunded: "bg-red-100 text-red-800",
  replacement_sent: "bg-violet-100 text-violet-800",
};

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

  useEffect(() => {
    const url = searchEmail
      ? `/api/orders?email=${encodeURIComponent(searchEmail)}`
      : "/api/orders";
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [searchEmail]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">My Orders</h1>
          <p className="text-sm text-neutral-500">Track your orders and delivery status</p>
        </div>

        {/* Email Search */}
        <div className="mb-6 flex gap-3">
          <input
            type="email"
            placeholder="Search by email (e.g., alice@example.com)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearchEmail(email)}
            className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <button
            onClick={() => setSearchEmail(email)}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Search
          </button>
          {searchEmail && (
            <button
              onClick={() => { setEmail(""); setSearchEmail(""); }}
              className="rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-200" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-lg font-medium text-neutral-600">No orders found</p>
            <p className="text-sm text-neutral-400 mt-1">
              {searchEmail ? `No orders for "${searchEmail}"` : "Place your first order from the shop!"}
            </p>
            <Link
              href="/"
              className="mt-4 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200/60 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm font-semibold text-neutral-900">
                      {order.id}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        statusStyles[order.status] || "bg-neutral-100"
                      }`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-neutral-900">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                  <span>{order.customerName}</span>
                  <span>•</span>
                  <span>{order.items.map((i) => i.name).join(", ")}</span>
                  <span>•</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                {order.trackingNumber && (
                  <p className="mt-1 text-xs text-neutral-400 font-mono">
                    Tracking: {order.trackingNumber}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
      <ChatSidebar />
    </>
  );
}

export default function OrdersPage() {
  return (
    <StoreProvider>
      <OrdersContent />
    </StoreProvider>
  );
}
