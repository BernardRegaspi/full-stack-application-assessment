import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "@/components/Pagination";
import en from "@/messages/en.json";

describe("Pagination", () => {
  it("renders a compact pager for large page counts", async () => {
    const onPage = vi.fn();
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <Pagination page={10} pageCount={40} onPage={onPage} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "9" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "11" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "40" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "20" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "11" }));
    expect(onPage).toHaveBeenCalledWith(11);
  });
});
