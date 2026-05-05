import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Step5Confirm } from "./Step5Confirm";

describe("Step5Confirm", () => {
  it("renders the repayment summary and primary action", () => {
    render(<Step5Confirm amount={42.5} repayAssetSymbol="USDC" onNext={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole("heading", { name: /confirm & execute/i })).toBeInTheDocument();
    expect(screen.getByText(/42\.5 usdc/i)).toBeInTheDocument();
  });

  it("calls onNext when Pay is clicked and onBack when Back is clicked", () => {
    const onNext = vi.fn();
    const onBack = vi.fn();
    render(<Step5Confirm amount={10} repayAssetSymbol="USDC" onNext={onNext} onBack={onBack} />);

    fireEvent.click(screen.getByRole("button", { name: /pay with usdc & execute/i }));
    expect(onNext).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
