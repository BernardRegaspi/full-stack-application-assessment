import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ProductPage from "@/app/[locale]/product/[barcode]/page";
import { CheckoutProvider } from "@/components/CheckoutProvider";
import en from "@/messages/en.json";

const product = vi.fn();
const checkout = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ barcode: "6111035000430" }),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/api", () => ({
  api: {
    product: (...args: unknown[]) => product(...args),
    checkout: (...args: unknown[]) => checkout(...args),
  },
}));

describe("ProductPage", () => {
  beforeEach(() => {
    product.mockReset();
    checkout.mockReset();
    product.mockResolvedValue({
      barcode: "6111035000430",
      name: "sidi ali",
      brand: null,
      imageUrl: null,
      servingSize: null,
      quantity: null,
      packaging: null,
      categories: [],
      labels: [],
      ingredients: null,
      origins: null,
      manufacturingPlaces: null,
      countries: null,
      nutriScore: null,
      novaGroup: null,
      incomplete: false,
      nutritionAccess: "locked",
    });
  });

  it("opens the checkout modal from Subscribe", async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <CheckoutProvider>
          <ProductPage />
        </CheckoutProvider>
      </NextIntlClientProvider>,
    );
    await user.click(await screen.findByRole("button", { name: /Get Pro/ }));
    expect(screen.getByRole("dialog", { name: "Pro Monthly" })).toBeInTheDocument();
    expect(checkout).not.toHaveBeenCalled();
  });
});
