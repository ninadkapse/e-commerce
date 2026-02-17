import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span>📍</span> Redmond, WA 98052
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span> 1-800-CONTOSO
              </li>
              <li className="flex items-center gap-2">
                <span>✉️</span> support@contoso.com
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">About</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">About Contoso</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Press</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* My Account */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">My Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
              <li><Link href="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Wishlist</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Returns</Link></li>
            </ul>
          </div>

          {/* Install App */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Install App</h4>
            <p className="text-sm text-neutral-400 mb-3">Available on mobile</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-2 text-xs">
                <span className="text-lg">🍎</span>
                <div>
                  <p className="text-[10px] text-neutral-500">Download on the</p>
                  <p className="font-semibold text-white">App Store</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-2 text-xs">
                <span className="text-lg">▶️</span>
                <div>
                  <p className="text-[10px] text-neutral-500">Get it on</p>
                  <p className="font-semibold text-white">Google Play</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Social */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-8 sm:flex-row">
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="rounded bg-neutral-800 px-2 py-1 font-mono">VISA</span>
            <span className="rounded bg-neutral-800 px-2 py-1 font-mono">MC</span>
            <span className="rounded bg-neutral-800 px-2 py-1 font-mono">AMEX</span>
            <span className="rounded bg-neutral-800 px-2 py-1 font-mono">PayPal</span>
          </div>
          <p className="text-xs text-neutral-500">
            © 2026 Contoso Electronics. All rights reserved. AI-powered by Microsoft Copilot.
          </p>
        </div>
      </div>
    </footer>
  );
}
