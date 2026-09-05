"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

const KNOWN_HOSTS = new Set(["images.openfoodfacts.org", "static.openfoodfacts.org"]);

function isKnownHost(url: string): boolean {
  try {
    return KNOWN_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

function Placeholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={`noimg flex flex-col items-center justify-center gap-2 text-ink/40 ${className ?? "h-full w-full"}`}
    >
      <svg
        className="h-10 w-10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="M3 17l5-4 4 3 4-4 5 5" />
      </svg>
      <span className="text-[10px] font-semibold tracking-wider uppercase">{label}</span>
    </div>
  );
}

export function ProductImage({
  imageUrl,
  name,
  className = "h-full w-full object-contain p-4",
}: {
  imageUrl: string | null;
  name: string | null;
  className?: string;
}) {
  const t = useTranslations();
  const alt = name ?? t("unknownProduct");

  if (!imageUrl) {
    return (
      <Placeholder
        label={t("missingImage")}
        className={className.includes("absolute") ? "absolute inset-0 h-full w-full" : "h-full w-full"}
      />
    );
  }

  if (isKnownHost(imageUrl)) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        width={400}
        height={400}
        className={className}
      />
    );
  }

  return (
    // Native img for hosts not listed in next.config remotePatterns
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt={alt} className={className} />
  );
}
