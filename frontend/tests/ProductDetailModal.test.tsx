import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CheckoutProvider } from "@/components/CheckoutProvider";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailProvider } from "@/components/ProductDetailProvider";
import en from "@/messages/en.json";

const product = vi.fn();
const checkout = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    product: (...args: unknown[]) => product(...args),
    checkout: (...args: unknown[]) => checkout(...args),
  },
}));

const summary = {
  barcode: "6111035000430",
  name: "sidi ali",
  brand: null,
  imageUrl: null,
};

function renderCard() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CheckoutProvider>
        <ProductDetailProvider>
          <ProductCard product={summary} />
        </ProductDetailProvider>
      </CheckoutProvider>
    </NextIntlClientProvider>,
  );
}

describe("Product detail modal", () => {
  beforeEach(() => {
    product.mockReset();
    checkout.mockReset();
    product.mockResolvedValue({
      ...summary,
      servingSize: null,
      quantity: "1.5 L",
      packaging: "Plastic",
      categories: ["Waters"],
      labels: [],
      ingredients: "Water, natural mineral salts.",
      origins: "Morocco",
      manufacturingPlaces: "Maroc",
      countries: "Morocco, France",
      nutriScore: "A",
      novaGroup: 1,
      incomplete: false,
      nutritionAccess: "locked",
    });
  });

  it("opens from a product card and closes on Escape and backdrop", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole("button", { name: /sidi ali/i }));
    expect(await screen.findByRole("dialog", { name: "sidi ali" })).toBeInTheDocument();
    expect(product).toHaveBeenCalledWith("6111035000430", "en");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "sidi ali" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /sidi ali/i }));
    expect(await screen.findByRole("dialog", { name: "sidi ali" })).toBeInTheDocument();
    await user.click(screen.getByTestId("product-detail-overlay"));
    expect(screen.queryByRole("dialog", { name: "sidi ali" })).not.toBeInTheDocument();
  });

  it("opens the checkout modal from Get Pro inside the detail overlay", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole("button", { name: /sidi ali/i }));
    expect(await screen.findByText("Quantity:")).toBeInTheDocument();
    expect(screen.getByText("Water, natural mineral salts.")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText(/NOVA 1/)).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /Get Pro/ }));
    expect(screen.getByRole("dialog", { name: "Pro Monthly" })).toBeInTheDocument();
    expect(checkout).not.toHaveBeenCalled();
  });
});
