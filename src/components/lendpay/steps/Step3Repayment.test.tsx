import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Step3Repayment } from "./Step3Repayment";
import { demoRepaySnapshot, MIN_REPAY_AMOUNT } from "@/lib/repaySnapshot";

vi.mock("@/hooks/useUsdcBalance", () => ({
  useUsdcBalance: () => ({
    formatted: 1_000_000,
    isLoading: false,
    isError: false,
    isConnected: true,
    refetch: vi.fn(),
  }),
}));

describe("Step3Repayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enables Continue and passes the selected repayment amount to onNext", () => {
    const onNext = vi.fn();
    const snapshot = demoRepaySnapshot("USDC");

    render(<Step3Repayment borrowSnapshot={snapshot} onNext={onNext} onBack={vi.fn()} />);

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).not.toBeDisabled();

    fireEvent.click(continueBtn);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledWith(MIN_REPAY_AMOUNT);
  });

  it("invokes onBack when Back is clicked", () => {
    const onBack = vi.fn();
    render(<Step3Repayment borrowSnapshot={demoRepaySnapshot("USDC")} onNext={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
