"use client";

import { useState, useEffect, useCallback } from "react";
import { Order, Product } from "@/lib/types";
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

type Tab = "dashboard" | "orders" | "products";

const sidebarItems: { id: Tab; icon: string; label: string }[] = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "orders", icon: "📦", label: "Orders" },
  { id: "products", icon: "🏷️", label: "Products" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [o, p] = await Promise.all([
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]);
    setOrders(o);
    setProducts(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const advanceOrder = async (orderId: string) => {
    await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "advance", orderId }),
    });
    fetchData();
  };

  const advanceAll = async () => {
    await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "advance-all" }),
    });
    fetchData();
  };

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const pendingCount = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
  const uniqueCustomers = new Set(orders.map((o) => o.email)).size;

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-200 bg-white flex flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white">
              C
            </div>
            <span className="text-lg font-semibold text-neutral-900">Contoso</span>
          </Link>
          <span className="ml-auto rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            ADMIN
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                tab === item.id
                  ? "bg-[#0078D4] text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-neutral-200 p-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-[#0078D4] transition-colors">
            ← Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {tab === "dashboard" && (
          <>
            <h1 className="text-2xl font-bold text-neutral-900 mb-6">Dashboard</h1>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {[
                { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: "💰", color: "from-emerald-500 to-emerald-600" },
                { label: "Total Orders", value: orders.length.toString(), icon: "📦", color: "from-blue-500 to-blue-600" },
                { label: "Delivered", value: deliveredCount.toString(), icon: "✅", color: "from-purple-500 to-purple-600" },
                { label: "Customers", value: uniqueCustomers.toString(), icon: "👤", color: "from-amber-500 to-amber-600" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/60">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-lg text-white shadow-sm`}>
                      {stat.icon}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                  <p className="text-xs text-neutral-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">Recent Orders</h2>
              <div className="flex gap-3">
                <span className="text-xs text-neutral-400">{pendingCount} pending</span>
                <button
                  onClick={advanceAll}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  ⚡ Advance All
                </button>
              </div>
            </div>

            {/* Recent Orders */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-200" />
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-white shadow-sm ring-1 ring-neutral-200/60 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/80">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Order</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Customer</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Total</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map((order) => (
                      <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50/60">
                        <td className="px-4 py-3 font-mono text-sm font-medium text-neutral-900">{order.id}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-neutral-900">{order.customerName}</p>
                          <p className="text-xs text-neutral-400">{order.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-neutral-900">${order.total.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[order.status]}`}>
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {order.status !== "delivered" && order.status !== "refunded" ? (
                            <button
                              onClick={() => advanceOrder(order.id)}
                              className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              Advance ▶
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium">✓ Done</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "orders" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">All Orders</h1>
                <p className="text-sm text-neutral-500">{orders.length} total orders</p>
              </div>
              <button
                onClick={advanceAll}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                ⚡ Advance All Orders
              </button>
            </div>
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-neutral-200/60 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/80">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Order</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Customer</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Items</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Total</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Tracking</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50/60">
                      <td className="px-4 py-3 font-mono text-sm font-medium text-neutral-900">{order.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-neutral-900">{order.customerName}</p>
                        <p className="text-xs text-neutral-400">{order.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 max-w-[200px] truncate">
                        {order.items.map((i) => i.name).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-neutral-900">${order.total.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[order.status]}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-400">{order.trackingNumber || "—"}</td>
                      <td className="px-4 py-3">
                        {order.status !== "delivered" && order.status !== "refunded" ? (
                          <button
                            onClick={() => advanceOrder(order.id)}
                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            Advance ▶
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">✓ Complete</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "products" && (
          <>
            <h1 className="text-2xl font-bold text-neutral-900 mb-6">Inventory</h1>
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-neutral-200/60 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/80">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">SKU</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Product</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Price</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Stock</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.sku} className="border-b border-neutral-100 hover:bg-neutral-50/60">
                      <td className="px-4 py-3 font-mono text-xs text-neutral-500">{p.sku}</td>
                      <td className="px-4 py-3 text-sm font-medium text-neutral-900">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-neutral-600">{p.category}</td>
                      <td className="px-4 py-3 text-sm font-medium text-neutral-900">${p.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-neutral-600">{p.stock}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.stock > 20 ? "bg-emerald-100 text-emerald-700" : p.stock > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${p.stock > 20 ? "bg-emerald-500" : p.stock > 0 ? "bg-amber-500" : "bg-red-500"}`} />
                          {p.stock > 20 ? "In Stock" : p.stock > 0 ? "Low Stock" : "Out of Stock"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
