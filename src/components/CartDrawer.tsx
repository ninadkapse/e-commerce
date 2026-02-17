"use client";

import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { state, dispatch, cartTotal, removeFromCart } = useStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [name, setName] = useState(state.customerName);
  const [email, setEmail] = useState(state.customerEmail);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }

    setLoading(true);
    setError("");
    dispatch({ type: "SET_CUSTOMER", name, email });

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          email,
          items: state.cart.map((c) => ({
            sku: c.product.sku,
            name: c.product.name,
            price: c.product.price,
            quantity: c.quantity,
            image: c.product.image,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to place order");
        setLoading(false);
        return;
      }

      const order = await res.json();
      dispatch({ type: "CLEAR_CART" });
      onClose();
      router.push(`/orders/${order.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Shopping Cart ({state.cart.length})
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {state.cart.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-4xl mb-3">🛒</p>
              <p className="text-sm text-neutral-500">Your cart is empty</p>
            </div>
          )}
          {state.cart.map((item) => (
            <div
              key={item.product.sku}
              className="flex items-center gap-4 rounded-xl bg-neutral-50 p-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-2xl">
                {item.product.category === "Laptops" ? "💻" :
                 item.product.category === "Gaming" ? "🎮" :
                 item.product.category === "Software" ? "📀" :
                 item.product.category === "Tablets" ? "📱" :
                 item.product.category === "Audio" ? "🎧" : "🖱️"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {item.product.name}
                </p>
                <p className="text-xs text-neutral-500">
                  ${item.product.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    dispatch({
                      type: "UPDATE_QUANTITY",
                      sku: item.product.sku,
                      quantity: item.quantity - 1,
                    })
                  }
                  className="h-7 w-7 rounded-md bg-white text-sm font-medium text-neutral-600 ring-1 ring-neutral-200"
                >
                  −
                </button>
                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                <button
                  onClick={() =>
                    dispatch({
                      type: "UPDATE_QUANTITY",
                      sku: item.product.sku,
                      quantity: item.quantity + 1,
                    })
                  }
                  className="h-7 w-7 rounded-md bg-white text-sm font-medium text-neutral-600 ring-1 ring-neutral-200"
                >
                  +
                </button>
                <button
                  onClick={() => removeFromCart(item.product.sku)}
                  className="ml-1 text-neutral-400 hover:text-red-500"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Form */}
        {state.cart.length > 0 && (
          <div className="border-t border-neutral-100 p-6 space-y-4">
            {showCheckout ? (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                {error && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}
              </>
            ) : null}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-500">Total</span>
              <span className="text-xl font-bold text-neutral-900">
                ${cartTotal.toFixed(2)}
              </span>
            </div>

            {showCheckout ? (
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Placing Order…" : "Place Order"}
              </button>
            ) : (
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Checkout
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
