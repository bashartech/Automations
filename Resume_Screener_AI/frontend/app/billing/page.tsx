'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, CreditBalance, CreditTransaction } from '@/lib/api';

export default function BillingPage() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCreditBalance().then(setBalance),
      api.getCreditHistory().then(setHistory),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Billing &amp; Credits</h1>

      <div className="bg-white rounded-lg shadow border p-6 mb-8">
        <p className="text-sm text-gray-500">Available Credits</p>
        <p className="text-4xl font-bold text-gray-900 mt-1">
          {balance?.credits_remaining ?? 0}
        </p>
        <Link
          href="/pricing"
          className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Buy Credits
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Transaction History</h2>
        {history.length === 0 ? (
          <p className="text-gray-500">No transactions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Date</th>
                <th className="pb-2">Reason</th>
                <th className="pb-2 text-right">Credits</th>
              </tr>
            </thead>
            <tbody>
              {history.map(tx => (
                <tr key={tx.id} className="border-b last:border-0">
                  <td className="py-2 text-gray-600">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-gray-700 capitalize">
                    {tx.reason.replace(/_/g, ' ')}
                  </td>
                  <td className={`py-2 text-right font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
