import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CheckoutProvider, useCheckout } from "@/components/CheckoutProvider";
import en from "@/messages/en.json";

const checkout = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    checkout: (...args: unknown[]) => checkout(...args),
  },
}));

function OpenButton() {
  const { openCheckout } = useCheckout();
  return (
    <button type="button" onClick={openCheckout}>
      Open checkout
    </button>
  );
}

function renderCheckout() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CheckoutProvider>
        <OpenButton />
      </CheckoutProvider>
    </NextIntlClientProvider>,
  );
}

describe("CheckoutModal", () => {
  beforeEach(() => {
    checkout.mockReset();
    vi.unstubAllGlobals();
  });

  it("is closed by default", () => {
    renderCheckout();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens from openCheckout and closes on Escape and backdrop", async () => {
    const user = userEvent.setup();
    renderCheckout();
    await user.click(screen.getByRole("button", { name: "Open checkout" }));
    expect(screen.getByRole("dialog", { name: "Pro Monthly" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open checkout" }));
    await user.click(screen.getByTestId("checkout-overlay"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls api.checkout with the locale and assigns the Stripe URL", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    checkout.mockResolvedValueOnce({ url: "https://checkout.stripe.com/test" });
    const user = userEvent.setup();
    renderCheckout();
    await user.click(screen.getByRole("button", { name: "Open checkout" }));
    await user.click(screen.getByRole("button", { name: /Subscribe · €4\.99\/month/ }));
    expect(checkout).toHaveBeenCalledWith("en");
    expect(assign).toHaveBeenCalledWith("https://checkout.stripe.com/test");
  });

  it("shows checkoutError and does not assign location when checkout fails", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    checkout.mockRejectedValueOnce(new Error("fail"));
    const user = userEvent.setup();
    renderCheckout();
    await user.click(screen.getByRole("button", { name: "Open checkout" }));
    await user.click(screen.getByRole("button", { name: /Subscribe · €4\.99\/month/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Checkout is unavailable. Try again.",
    );
    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
