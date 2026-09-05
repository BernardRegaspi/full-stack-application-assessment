import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { LanguageSelector } from "@/components/LanguageSelector";
import en from "@/messages/en.json";
import nl from "@/messages/nl.json";

const replace = vi.fn();

vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["en", "nl", "de", "fr"], defaultLocale: "en" },
  usePathname: () => "/",
  useRouter: () => ({ replace }),
}));

function renderSelector(locale: "en" | "nl") {
  const messages = locale === "en" ? en : nl;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LanguageSelector />
    </NextIntlClientProvider>,
  );
}

describe("LanguageSelector", () => {
  it("shows translated language label and can change locale", async () => {
    const user = userEvent.setup();
    renderSelector("en");
    expect(screen.getByLabelText("Language")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "nl" }));
    expect(replace).toHaveBeenCalled();
  });
});
