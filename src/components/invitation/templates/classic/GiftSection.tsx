"use client";

import { useState } from "react";
import { Copy, Check, CreditCard, Wallet, Gift } from "lucide-react";

interface GiftItem {
  id: string;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  ewalletType: string | null;
  ewalletNumber: string | null;
  isActive: boolean;
}

interface Props {
  gifts: GiftItem[];
}

export function GiftSection({ gifts }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const active = gifts.filter((g) => g.isActive);
  if (active.length === 0) return null;

  const banks = active.filter((g) => g.bankName);
  const ewallets = active.filter((g) => g.ewalletType);

  async function handleCopy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase text-stone-400 mb-3">
            Hadiah Pernikahan
          </p>
          <h2 className="font-heading text-3xl text-stone-800">Amplop Digital</h2>
          <div className="w-12 h-px bg-stone-300 mx-auto mt-4" />
          <p className="text-sm text-stone-500 mt-4 max-w-xs mx-auto">
            Doa restu Anda adalah hadiah terbaik bagi kami. Namun jika berkenan
            memberikan hadiah, berikut informasinya.
          </p>
        </div>

        <div className="space-y-3">
          {banks.map((gift) => (
            <div
              key={gift.id}
              className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-50 rounded-xl shrink-0">
                  <CreditCard size={18} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-stone-400 mb-0.5">Transfer Bank</p>
                  <p className="font-semibold text-stone-800">{gift.bankName}</p>
                  <p className="text-stone-600 font-mono text-sm mt-1">
                    {gift.accountNumber}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">{gift.accountName}</p>
                </div>
                <button
                  onClick={() => handleCopy(gift.id, gift.accountNumber || "")}
                  className="shrink-0 p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
                  title="Salin nomor rekening"
                >
                  {copiedId === gift.id ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}

          {ewallets.map((gift) => (
            <div
              key={gift.id}
              className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-green-50 rounded-xl shrink-0">
                  <Wallet size={18} className="text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-stone-400 mb-0.5">E-Wallet</p>
                  <p className="font-semibold text-stone-800">{gift.ewalletType}</p>
                  <p className="text-stone-600 font-mono text-sm mt-1">
                    {gift.ewalletNumber}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(gift.id + "-ew", gift.ewalletNumber || "")}
                  className="shrink-0 p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
                  title="Salin nomor"
                >
                  {copiedId === gift.id + "-ew" ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Gift size={20} className="text-stone-300 mx-auto mb-2" />
          <p className="text-xs text-stone-400">
            Terima kasih atas perhatian dan kasih sayang Anda
          </p>
        </div>
      </div>
    </section>
  );
}
