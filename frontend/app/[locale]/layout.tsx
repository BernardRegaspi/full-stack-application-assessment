import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { CheckoutProvider } from "@/components/CheckoutProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductDetailProvider } from "@/components/ProductDetailProvider";
import { routing } from "@/i18n/routing";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NutriFind",
  description: "Search packaged foods and unlock per-100g nutrition.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-cream font-sans text-ink">
        <div className="noise" />
        <div className="glow -top-32 -left-32 h-[420px] w-[420px] bg-moss/10" />
        <div className="glow top-40 -right-32 h-[380px] w-[380px] bg-amber/15" />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CheckoutProvider>
            <ProductDetailProvider>
              <Header />
              <div className="relative z-10 flex flex-1 flex-col">{children}</div>
              <Footer />
            </ProductDetailProvider>
          </CheckoutProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
