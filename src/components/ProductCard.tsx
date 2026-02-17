"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { useStore } from "@/lib/store";

interface Props {
  product: Product;
  variant?: "light" | "dark";
}

export default function ProductCard({ product, variant = "light" }: Props) {
  const { addToCart } = useStore();
  const inStock = product.stock > 0;
  const isDark = variant === "dark";

  return (
    <div
      className={`group rounded-2xl overflow-hidden transition-all hover:shadow-lg ${
        isDark
          ? "bg-neutral-800 ring-1 ring-neutral-700"
          : "bg-white shadow-sm ring-1 ring-neutral-200/60"
      }`}
    >
      <Link href={`/products/${product.sku}`}>
        <div
          className={`relative aspect-square p-6 flex items-center justify-center transition-transform group-hover:scale-[1.02] ${
            isDark ? "bg-neutral-700/50" : "bg-neutral-50"
          }`}
        >
          <Image
            src={product.image}
            alt={product.name}
            width={140}
            height={140}
            className="object-contain drop-shadow-md"
          />
          {product.stock <= 5 && product.stock > 0 && (
            <span className="absolute top-3 left-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
              Only {product.stock} left!
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute top-3 left-3 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              Sold Out
            </span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <p className={`text-xs font-medium ${isDark ? "text-blue-400" : "text-blue-600"}`}>
          {product.category}
        </p>
        <Link href={`/products/${product.sku}`}>
          <h3
            className={`mt-1 text-sm font-semibold line-clamp-1 hover:underline ${
              isDark ? "text-white" : "text-neutral-900"
            }`}
          >
            {product.name}
          </h3>
        </Link>
        <p
          className={`mt-1.5 text-xs line-clamp-2 ${
            isDark ? "text-neutral-400" : "text-neutral-500"
          }`}
        >
          {product.description}
        </p>
        <div className="mt-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`h-3.5 w-3.5 ${star <= 4 ? "text-yellow-400" : "text-neutral-300"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className={`ml-1 text-[10px] ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
            (4.0)
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className={`text-lg font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
            ${product.price.toFixed(2)}
          </span>
          <button
            onClick={() => addToCart(product)}
            disabled={!inStock}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              isDark
                ? "bg-blue-500 text-white hover:bg-blue-400 disabled:bg-neutral-700 disabled:text-neutral-500"
                : "bg-[#0078D4] text-white hover:bg-[#005A9E] disabled:bg-neutral-200 disabled:text-neutral-400"
            } disabled:cursor-not-allowed`}
          >
            {inStock ? "Add to Cart" : "Sold Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
