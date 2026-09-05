import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi, beforeEach } from "vitest";
import HomePage from "@/app/[locale]/page";
import { CheckoutProvider } from "@/components/CheckoutProvider";
import { ProductDetailProvider } from "@/components/ProductDetailProvider";
import en from "@/messages/en.json";

const search = vi.fn();
const history = vi.fn();
const featured = vi.fn();
const me = vi.fn();
const clearHistory = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    search: (...args: unknown[]) => search(...args),
    history: (...args: unknown[]) => history(...args),
    featured: (...args: unknown[]) => featured(...args),
    me: (...args: unknown[]) => me(...args),
    clearHistory: (...args: unknown[]) => clearHistory(...args),
  },
  ApiError: class ApiError extends Error {
    constructor(
      public readonly code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

function renderHome() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CheckoutProvider>
        <ProductDetailProvider>
          <HomePage />
        </ProductDetailProvider>
      </CheckoutProvider>
    </NextIntlClientProvider>,
  );
}

describe("HomePage search pagination", () => {
  beforeEach(() => {
    search.mockReset();
    history.mockReset();
    featured.mockReset();
    me.mockReset();
    clearHistory.mockReset();
    history.mockResolvedValue({ searches: [] });
    featured.mockResolvedValue({
      products: [],
      resultCount: 0,
      page: 1,
      pageSize: 24,
      pageCount: 1,
    });
    me.mockResolvedValue({ email: "demo@example.com", subscriptionStatus: "none" });
    search.mockResolvedValue({
      products: [{ barcode: "1", name: "Corn", brand: "Del Monte", imageUrl: null }],
      resultCount: 62,
      page: 1,
      pageSize: 24,
      pageCount: 3,
    });
  });

  it("shows total match count and pages through results", async () => {
    const user = userEvent.setup();
    renderHome();

    await user.type(screen.getByRole("searchbox"), "delmonte");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByRole("heading", { name: "62 products" })).toBeInTheDocument();
    expect(search).toHaveBeenCalledWith("delmonte", "en", 1);

    const pager = screen.getByRole("navigation", { name: "Pagination" });
    expect(pager).toBeInTheDocument();

    search.mockResolvedValue({
      products: [{ barcode: "2", name: "Ketchup", brand: "Del Monte", imageUrl: null }],
      resultCount: 62,
      page: 2,
      pageSize: 24,
      pageCount: 3,
    });

    await user.click(screen.getByRole("button", { name: "2" }));

    await waitFor(() => {
      expect(search).toHaveBeenCalledWith("delmonte", "en", 2);
    });
    expect(await screen.findByText("Ketchup")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "62 products" })).toBeInTheDocument();
  });
});
