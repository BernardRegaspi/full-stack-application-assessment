"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import type { SubscriptionStatus } from "@/lib/types";
import { useCheckout } from "./CheckoutProvider";

type ProfileMenuProps = {
  email: string | null;
  status: SubscriptionStatus;
  onStatusChange: (status: SubscriptionStatus) => void;
};

export function ProfileMenu({ email, status, onStatusChange }: ProfileMenuProps) {
  const t = useTranslations();
  const { openCheckout } = useCheckout();
  const [open, setOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isPro = status === "active";

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function onUnsubscribe() {
    setCancelError(null);
    setCanceling(true);
    try {
      const result = await api.cancelSubscription();
      onStatusChange(result.subscriptionStatus);
      setOpen(false);
      window.dispatchEvent(new Event("subscription-changed"));
    } catch {
      setCancelError(t("unsubscribeError"));
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-cream transition-colors hover:bg-mossdark"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("profileMenu")}
        onClick={() => {
          setCancelError(null);
          setOpen((value) => !value);
        }}
      >
        D
      </button>
      {open ? (
        <div
          role="menu"
          className="pop-in absolute right-0 z-50 mt-2 w-64 rounded-xl border border-ink/10 bg-white p-2 shadow-card"
        >
          <div className="mb-1 border-b border-ink/10 px-3 py-2">
            <p className="text-[11px] tracking-wider text-ink/50 uppercase">{t("signedIn")}</p>
            {email ? <p className="text-sm font-semibold">{email}</p> : null}
            <p className={`mt-0.5 text-xs ${isPro ? "font-semibold text-moss" : "text-ink/50"}`}>
              {isPro ? t("statusPro") : t("statusFree")}
            </p>
          </div>
          {isPro ? (
            <button
              type="button"
              role="menuitem"
              disabled={canceling}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink/70 transition-colors hover:bg-ink/5 disabled:opacity-60"
              onClick={() => void onUnsubscribe()}
            >
              {canceling ? t("unsubscribing") : t("cancelSub")}
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-moss transition-colors hover:bg-moss/10"
              onClick={() => {
                setOpen(false);
                openCheckout();
              }}
            >
              {t("upgrade")} →
            </button>
          )}
          {cancelError ? (
            <p role="alert" className="px-3 py-2 text-xs text-ink">
              {cancelError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
