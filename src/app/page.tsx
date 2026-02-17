"use client";

import { useState, useEffect } from "react";
import { StoreProvider } from "@/lib/store";
import { Product } from "@/lib/types";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import ChatSidebar from "@/components/ChatSidebar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";

const categories = [
  { name: "Laptops", icon: "/products/laptop.svg", href: "/?cat=Laptops" },
  { name: "Tablets", icon: "/products/tablet.svg", href: "/?cat=Tablets" },
  { name: "Gaming", icon: "/products/console.svg", href: "/?cat=Gaming" },
  { name: "Audio", icon: "/products/headphones.svg", href: "/?cat=Audio" },
  { name: "Software", icon: "/products/software.svg", href: "/?cat=Software" },
  { name: "Accessories", icon: "/products/mouse.svg", href: "/?cat=Accessories" },
];

function CatalogContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : products;

  const featured = products.filter((p) =>
    ["SL5-001", "XSX-008", "SH3-006", "SP10-004"].includes(p.sku)
  );

  const deals = products.filter((p) => p.price < 150);

  return (
    <>
      <Navbar />

      {/* ─── Hero Banner ────────────────────────────────────── */}
      <section className="relative bg-gradient-to-r from-[#0078D4] to-[#005A9E] overflow-hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-16 lg:py-24">
          <div className="max-w-xl text-white">
            <span className="inline-block rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wider mb-4">
              New Arrivals 2026
            </span>
            <h1 className="text-4xl font-extrabold leading-tight lg:text-5xl">
              Discover the latest in
              <br />
              <span className="text-yellow-300">Contoso Tech</span>
            </h1>
            <p className="mt-4 text-base text-white/80 leading-relaxed">
              Premium electronics, powerful gaming, and productivity tools — all in one place.
              Free shipping on orders over $99.
            </p>
            <div className="mt-8 flex gap-3">
              <a
                href="#products"
                className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0078D4] shadow-lg transition hover:bg-neutral-100"
              >
                Shop Now
              </a>
              <Link
                href="/orders"
                className="rounded-xl border-2 border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Track Order
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <Image
              src="/products/laptop.svg"
              alt="Surface Laptop"
              width={320}
              height={320}
              className="drop-shadow-2xl opacity-80"
            />
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/5" />
      </section>

      {/* ─── Category Circles ───────────────────────────────── */}
      <section className="bg-neutral-50 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-center gap-8 lg:gap-12 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() =>
                  setActiveCategory(activeCategory === cat.name ? null : cat.name)
                }
                className={`flex flex-col items-center gap-2 transition-transform hover:scale-105 ${
                  activeCategory === cat.name ? "scale-110" : ""
                }`}
              >
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full border-2 bg-white p-4 shadow-sm transition-colors ${
                    activeCategory === cat.name
                      ? "border-[#0078D4] ring-2 ring-[#0078D4]/30"
                      : "border-neutral-200 hover:border-[#0078D4]/50"
                  }`}
                >
                  <Image src={cat.icon} alt={cat.name} width={40} height={40} />
                </div>
                <span
                  className={`text-xs font-semibold ${
                    activeCategory === cat.name ? "text-[#0078D4]" : "text-neutral-600"
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Promo Banner ───────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="rounded-2xl bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-400 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-yellow-900 uppercase tracking-wider">Limited Time Offer</p>
            <h3 className="mt-1 text-2xl font-extrabold text-yellow-900">
              Up to 30% off on Surface Accessories
            </h3>
            <p className="text-sm text-yellow-800 mt-1">Use code <span className="font-mono font-bold">CONTOSO30</span> at checkout</p>
          </div>
          <a
            href="#products"
            className="hidden sm:inline-flex rounded-xl bg-yellow-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-yellow-950 transition-colors"
          >
            Shop Deals →
          </a>
        </div>
      </section>

      {/* ─── Featured Products ──────────────────────────────── */}
      {!activeCategory && featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Featured Products</h2>
              <p className="text-sm text-neutral-500">Our top picks for you</p>
            </div>
            <a href="#products" className="text-sm font-semibold text-[#0078D4] hover:underline">
              View All →
            </a>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.sku} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ─── All Products ───────────────────────────────────── */}
      <section id="products" className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">
              {activeCategory ? activeCategory : "All Products"}
            </h2>
            <p className="text-sm text-neutral-500">
              {activeCategory
                ? `Showing ${filtered.length} products in ${activeCategory}`
                : `${products.length} products available`}
            </p>
          </div>
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              className="text-sm font-semibold text-[#0078D4] hover:underline"
            >
              ← Show All
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-neutral-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.sku} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ─── Hard to Resist Deals ───────────────────────────── */}
      {!activeCategory && deals.length > 0 && (
        <section className="bg-neutral-900 py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-8">
              <span className="inline-block rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider mb-2">
                🔥 Hot Deals
              </span>
              <h2 className="text-3xl font-bold text-white">Hard to Resist Deals</h2>
              <p className="text-sm text-neutral-400 mt-1">Top products under $150</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {deals.map((p) => (
                <ProductCard key={p.sku} product={p} variant="dark" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Newsletter ─────────────────────────────────────── */}
      <section className="bg-[#0078D4] py-12">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h3 className="text-2xl font-bold text-white">Sign Up for Newsletters</h3>
          <p className="mt-2 text-sm text-white/70">
            Get email updates about our latest products and{" "}
            <span className="font-semibold text-yellow-300">special offers</span>.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <input
              type="email"
              placeholder="Your email address"
              className="w-full max-w-sm rounded-xl border-0 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md"
            />
            <button className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0078D4] transition hover:bg-neutral-100">
              Sign Up
            </button>
          </div>
        </div>
      </section>

      <Footer />
      <ChatSidebar />
    </>
  );
}

export default function Home() {
  return (
    <StoreProvider>
      <CatalogContent />
    </StoreProvider>
  );
}
