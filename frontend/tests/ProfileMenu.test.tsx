import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ProfileMenu } from "@/components/ProfileMenu";
import en from "@/messages/en.json";

const cancelSubscription = vi.fn();
const openCheckout = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    cancelSubscription: (...args: unknown[]) => cancelSubscription(...args),
  },
}));

vi.mock("@/components/CheckoutProvider", () => ({
  useCheckout: () => ({
    open: false,
    error: null,
    submitting: false,
    openCheckout,
    closeCheckout: vi.fn(),
    startCheckout: vi.fn(),
  }),
}));

function renderMenu(
  status: "active" | "none" | "canceled" | "past_due" = "active",
  email: string | null = "demo@example.com",
) {
  const onStatusChange = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ProfileMenu email={email} status={status} onStatusChange={onStatusChange} />
    </NextIntlClientProvider>,
  );
  return { onStatusChange };
}

describe("ProfileMenu", () => {
  beforeEach(() => {
    cancelSubscription.mockReset();
    openCheckout.mockReset();
  });

  it("shows upgrade for free users and opens checkout", async () => {
    const user = userEvent.setup();
    renderMenu("none");
    await user.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByText("Signed in as")).toBeInTheDocument();
    expect(screen.getByText("demo@example.com")).toBeInTheDocument();
    expect(screen.getByText("Free plan")).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: /Upgrade to Pro/ }));
    expect(openCheckout).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("shows cancel for active subscribers and hides upgrade", async () => {
    const user = userEvent.setup();
    renderMenu("active");
    await user.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByText("Pro — active")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cancel subscription" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Upgrade to Pro/ })).not.toBeInTheDocument();
  });

  it("calls cancelSubscription when cancel is clicked", async () => {
    const user = userEvent.setup();
    cancelSubscription.mockResolvedValueOnce({ subscriptionStatus: "canceled" });
    const { onStatusChange } = renderMenu("active");
    await user.click(screen.getByRole("button", { name: "Account menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Cancel subscription" }));
    expect(cancelSubscription).toHaveBeenCalledOnce();
    expect(onStatusChange).toHaveBeenCalledWith("canceled");
  });

  it("omits the email line when email is null", async () => {
    const user = userEvent.setup();
    renderMenu("canceled", null);
    await user.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByText("Signed in as")).toBeInTheDocument();
    expect(screen.queryByText("demo@example.com")).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Upgrade to Pro/ })).toBeInTheDocument();
  });
});
