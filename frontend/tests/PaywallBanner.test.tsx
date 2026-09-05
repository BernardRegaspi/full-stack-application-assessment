import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CheckoutProvider } from "@/components/CheckoutProvider";
import { PaywallBanner } from "@/components/PaywallBanner";
import en from "@/messages/en.json";

const me = vi.fn();
const checkout = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    me: (...args: unknown[]) => me(...args),
    checkout: (...args: unknown[]) => checkout(...args),
  },
}));

describe("PaywallBanner", () => {
  beforeEach(() => {
    me.mockReset();
    checkout.mockReset();
    me.mockResolvedValue({ email: "demo@example.com", subscriptionStatus: "none" });
  });

  it("opens the checkout modal from Get Pro and does not call api.checkout until Pay", async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <CheckoutProvider>
          <PaywallBanner />
        </CheckoutProvider>
      </NextIntlClientProvider>,
    );
    await user.click(await screen.findByRole("button", { name: /Get Pro/ }));
    expect(screen.getByRole("dialog", { name: "Pro Monthly" })).toBeInTheDocument();
    expect(checkout).not.toHaveBeenCalled();
  });
});
