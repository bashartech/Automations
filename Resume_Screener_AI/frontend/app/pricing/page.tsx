'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, CreditPack, isAuthenticated } from '@/lib/api';

export default function PricingPage() {
  const router = useRouter();
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.getCreditPacks().then(setPacks).catch(console.error);
  }, []);

  const handleBuy = async (pack: CreditPack) => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (pack.price_cents === 0) return;
    setBuying(pack.id);
    setMsg('');
    try {
      const res = await api.createCheckout(pack.id);
      if (res.mock && res.success) {
        setMsg(`Added ${res.credits_added} credits!`);
      } else if (res.url) {
        router.push(res.url);
      }
    } catch (e: any) {
      setMsg(e.message || 'Purchase failed');
    } finally {
      setBuying(null);
    }
  };

  const freePack = packs.find(p => p.price_cents === 0);
  const paidPacks = packs.filter(p => p.price_cents > 0);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Pricing</h1>
      <p className="text-gray-500 mb-8">Buy credit packs to process resumes. 1 credit = 1 resume.</p>

      {freePack && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-2xl font-bold text-green-700">{freePack.credits} Free Credits</p>
          <p className="text-green-600 mt-1">Included on sign-up — no payment needed</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paidPacks.map(pack => (
          <div key={pack.id} className="bg-white rounded-lg shadow border p-6 flex flex-col">
            <h2 className="text-xl font-bold text-gray-900">{pack.name}</h2>
            <p className="text-3xl font-bold text-gray-900 mt-4">
              ${(pack.price_cents / 100).toFixed(0)}
            </p>
            <p className="text-gray-500 mt-1">
              {pack.credits.toLocaleString()} credits &middot; ${(pack.price_cents / 100 / pack.credits).toFixed(3)}/credit
            </p>
            <div className="mt-6 flex-1" />
            <button
              onClick={() => handleBuy(pack)}
              disabled={buying === pack.id}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {buying === pack.id ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        ))}
      </div>

      {msg && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-center">
          {msg}
        </div>
      )}
    </div>
  );
}
