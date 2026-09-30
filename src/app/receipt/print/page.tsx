'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { dataStore } from '@/lib/data-store';
import PrintableReceipt, { ReceiptType } from '@/components/PrintableReceipt';
import { Sale } from '@/lib/types';

function PrintContent() {
  const searchParams = useSearchParams();
  const type = (searchParams.get('type') ?? 'test_print') as ReceiptType;
  const id = searchParams.get('id');

  const [sale, setSale] = useState<Sale | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (type === 'sale' && id) {
      const sales = dataStore.getSales();
      const found = sales.find((s) => s.id === id || s.sale_number === id);
      setSale(found);
    }
    setLoaded(true);
  }, [type, id]);

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  if (!loaded) {
    return <div className="p-4 text-center font-mono text-xs">Loading receipt for printing...</div>;
  }

  return (
    <div className="min-h-screen bg-white p-4 flex justify-center items-start">
      <PrintableReceipt type={type} sale={sale} />
    </div>
  );
}

export default function ReceiptPrintPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-xs font-mono">Loading receipt page...</div>}>
      <PrintContent />
    </Suspense>
  );
}
