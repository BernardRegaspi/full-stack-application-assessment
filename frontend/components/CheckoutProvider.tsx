"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { CheckoutModal } from "./CheckoutModal";

type CheckoutContextValue = {
  open: boolean;
  error: string | null;
  submitting: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  startCheckout: () => Promise<void>;
};

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) {
    throw new Error("useCheckout must be used within CheckoutProvider");
  }
  return ctx;
}

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openCheckout = useCallback(() => {
    setError(null);
    setOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setOpen(false);
    setError(null);
    setSubmitting(false);
  }, []);

  const startCheckout = useCallback(async () => {
    if (submitting) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { url } = await api.checkout(locale);
      window.location.assign(url);
    } catch {
      setError(t("checkoutError"));
      setSubmitting(false);
    }
  }, [locale, submitting, t]);

  const value = useMemo(
    () => ({
      open,
      error,
      submitting,
      openCheckout,
      closeCheckout,
      startCheckout,
    }),
    [open, error, submitting, openCheckout, closeCheckout, startCheckout],
  );

  return (
    <CheckoutContext.Provider value={value}>
      {children}
      <CheckoutModal />
    </CheckoutContext.Provider>
  );
}
