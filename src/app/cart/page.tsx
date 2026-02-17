"use client";

import { StoreProvider, useStore } from "@/lib/store";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatSidebar from "@/components/ChatSidebar";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function CartContent() {
  const { state, removeFromCart, updateQuantity, clearCart } = useStore();
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const subtotal = state.cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = subtotal > 99 ? 0 : 9.99;
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    if (!form.name || !form.email || !form.address) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          email: form.email,
          items: state.cart.map((i) => ({
            sku: i.product.sku,
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
            image: i.product.image,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order failed");
      setOrderId(data.id);
      clearCart();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPlacing(false);
    }
  };

  if (orderId) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <div className="mb-6 text-6xl">🎉</div>
          <h1 className="text-2xl font-bold text-neutral-900">Order Placed!</h1>
          <p className="mt-2 text-neutral-600">Your order <span className="font-mono font-bold text-[#0078D4]">{orderId}</span> has been confirmed.</p>
          <p className="mt-1 text-sm text-neutral-500">You&apos;ll receive updates via email.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href={`/orders/${orderId}`} className="rounded-xl bg-[#0078D4] px-6 py-3 text-sm font-bold text-white hover:bg-[#005A9E] transition-colors">
              Track Order
            </Link>
            <Link href="/" className="rounded-xl border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
        <Footer />
        <ChatSidebar />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-neutral-500">
          <Link href="/" className="hover:text-[#0078D4]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900 font-medium">Shopping Cart</span>
        </nav>

        <h1 className="text-2xl font-bold text-neutral-900 mb-8">Shopping Cart</h1>

        {state.cart.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl font-semibold text-neutral-700">Your cart is empty</h2>
            <p className="mt-2 text-sm text-neutral-500">Discover our latest products and add them to your cart.</p>
            <Link href="/" className="mt-6 inline-block rounded-xl bg-[#0078D4] px-6 py-3 text-sm font-bold text-white hover:bg-[#005A9E]">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {state.cart.map((item) => (
                <div key={item.product.sku} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200/60">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-neutral-50 p-2">
                    <Image src={item.product.image} alt={item.product.name} width={64} height={64} className="object-contain" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link href={`/products/${item.product.sku}`} className="text-sm font-semibold text-neutral-900 hover:underline">
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-neutral-500">{item.product.category}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-neutral-300">
                        <button onClick={() => updateQuantity(item.product.sku, item.quantity - 1)} className="px-3 py-1 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-l-lg">−</button>
                        <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.sku, item.quantity + 1)} className="px-3 py-1 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-r-lg">+</button>
                      </div>
                      <span className="text-sm font-bold text-neutral-900">${(item.product.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.product.sku)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary + Checkout */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/60">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal ({state.cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-emerald-600 font-medium" : ""}>
                      {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="border-t border-neutral-200 pt-2 mt-2 flex justify-between text-base font-bold text-neutral-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/60">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Checkout</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-700">Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-700">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-700">Shipping Address</label>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] resize-none"
                      placeholder="123 Main St, Seattle, WA 98101"
                    />
                  </div>
                  {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                  <button
                    onClick={handleCheckout}
                    disabled={placing}
                    className="w-full rounded-xl bg-[#0078D4] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#005A9E] disabled:bg-neutral-300 disabled:cursor-not-allowed"
                  >
                    {placing ? "Placing Order..." : `Place Order · $${total.toFixed(2)}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
      <ChatSidebar />
    </>
  );
}

export default function CartPage() {
  return (
    <StoreProvider>
      <CartContent />
    </StoreProvider>
  );
}
