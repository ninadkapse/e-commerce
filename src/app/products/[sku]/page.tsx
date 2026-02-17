"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { StoreProvider, useStore } from "@/lib/store";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import ChatSidebar from "@/components/ChatSidebar";

function ProductDetail({ sku }: { sku: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useStore();

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((products: Product[]) => {
        const found = products.find((p) => p.sku === sku);
        setProduct(found || null);
        if (found) {
          setRelated(
            products
              .filter((p) => p.category === found.category && p.sku !== found.sku)
              .slice(0, 4)
          );
        }
      });
  }, [sku]);

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <div className="animate-pulse text-neutral-400">Loading product...</div>
        </div>
      </>
    );
  }

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <Navbar />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-6 py-4">
        <nav className="flex text-sm text-neutral-500">
          <Link href="/" className="hover:text-[#0078D4]">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/?cat=${product.category}`} className="hover:text-[#0078D4]">{product.category}</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900 font-medium">{product.name}</span>
        </nav>
      </div>

      {/* Product Section */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Image */}
          <div className="flex items-center justify-center rounded-2xl bg-neutral-50 p-12">
            <Image
              src={product.image}
              alt={product.name}
              width={300}
              height={300}
              className="object-contain drop-shadow-lg"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <span className="inline-block w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {product.category}
            </span>
            <h1 className="mt-3 text-3xl font-bold text-neutral-900">{product.name}</h1>

            {/* Rating */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className={`h-5 w-5 ${s <= 4 ? "text-yellow-400" : "text-neutral-300"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-neutral-500">(4.0) · 128 reviews</span>
            </div>

            <p className="mt-4 text-base text-neutral-600 leading-relaxed">{product.description}</p>

            <div className="mt-6">
              <span className="text-3xl font-extrabold text-neutral-900">${product.price.toFixed(2)}</span>
              {product.price > 99 && (
                <span className="ml-2 text-sm text-emerald-600 font-medium">Free Shipping</span>
              )}
            </div>

            {/* Stock */}
            <div className="mt-4 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${product.stock > 20 ? "bg-emerald-500" : product.stock > 0 ? "bg-amber-500" : "bg-red-500"}`} />
              <span className={`text-sm font-medium ${product.stock > 0 ? "text-emerald-700" : "text-red-600"}`}>
                {product.stock > 20 ? "In Stock" : product.stock > 0 ? `Only ${product.stock} left` : "Out of Stock"}
              </span>
            </div>

            {/* Quantity + Add to Cart */}
            {product.stock > 0 && (
              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center rounded-xl border border-neutral-300">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-4 py-2.5 text-lg font-bold text-neutral-600 hover:bg-neutral-100 rounded-l-xl"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-sm font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    className="px-4 py-2.5 text-lg font-bold text-neutral-600 hover:bg-neutral-100 rounded-r-xl"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  className="flex-1 rounded-xl bg-[#0078D4] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#005A9E]"
                >
                  {added ? "✓ Added to Cart!" : "Add to Cart"}
                </button>
              </div>
            )}

            {/* Features */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { icon: "🚚", label: "Free Shipping", sub: "Orders over $99" },
                { icon: "🔄", label: "Easy Returns", sub: "30-day policy" },
                { icon: "🛡️", label: "Warranty", sub: "1 year included" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-center rounded-xl bg-neutral-50 p-3 text-center">
                  <span className="text-xl">{f.icon}</span>
                  <span className="mt-1 text-xs font-semibold text-neutral-800">{f.label}</span>
                  <span className="text-[10px] text-neutral-500">{f.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="bg-neutral-50 py-12">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-6 text-xl font-bold text-neutral-900">You May Also Like</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.sku} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
      <ChatSidebar />
    </>
  );
}

export default function ProductPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = use(params);
  return (
    <StoreProvider>
      <ProductDetail sku={sku} />
    </StoreProvider>
  );
}
