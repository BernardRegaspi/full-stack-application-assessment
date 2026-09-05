"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ProductDetailModal } from "./ProductDetailModal";

type ProductDetailContextValue = {
  barcode: string | null;
  openProduct: (barcode: string) => void;
  closeProduct: () => void;
};

const ProductDetailContext = createContext<ProductDetailContextValue | null>(null);

export function useProductDetail(): ProductDetailContextValue {
  const ctx = useContext(ProductDetailContext);
  if (!ctx) {
    throw new Error("useProductDetail must be used within ProductDetailProvider");
  }
  return ctx;
}

export function ProductDetailProvider({ children }: { children: ReactNode }) {
  const [barcode, setBarcode] = useState<string | null>(null);

  const openProduct = useCallback((next: string) => {
    setBarcode(next);
  }, []);

  const closeProduct = useCallback(() => {
    setBarcode(null);
  }, []);

  const value = useMemo(
    () => ({ barcode, openProduct, closeProduct }),
    [barcode, openProduct, closeProduct],
  );

  return (
    <ProductDetailContext.Provider value={value}>
      {children}
      <ProductDetailModal />
    </ProductDetailContext.Provider>
  );
}
