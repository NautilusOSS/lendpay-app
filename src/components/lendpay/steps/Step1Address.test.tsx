import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Step1Address } from "./Step1Address";

const VALID_EVM = `0x${"a".repeat(40)}`;
/** 58 base32 chars (A–Z, 2–7) */
const VALID_ALGO = "A".repeat(58);

describe("Step1Address", () => {
  it("disables Continue until the address is valid", () => {
    render(<Step1Address onNext={vi.fn()} />);
    const input = screen.getByPlaceholderText(/0x\.\.\. or algorand address/i);
    const continueBtn = screen.getByRole("button", { name: /continue/i });

    expect(continueBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: "not-an-address" } });
    expect(continueBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: VALID_EVM } });
    expect(continueBtn).not.toBeDisabled();
  });

  it("shows validation errors for empty and invalid submissions", () => {
    render(<Step1Address onNext={vi.fn()} />);
    const input = screen.getByPlaceholderText(/0x\.\.\. or algorand address/i);

    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText(/please enter a wallet address/i)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "0xbad" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText(/invalid address/i)).toBeInTheDocument();
  });

  it("calls onNext with trimmed address and kind for EVM and Algorand", () => {
    const onNext = vi.fn();

    const { rerender } = render(<Step1Address onNext={onNext} />);
    const input = screen.getByPlaceholderText(/0x\.\.\. or algorand address/i);

    fireEvent.change(input, { target: { value: `  ${VALID_EVM}  ` } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onNext).toHaveBeenCalledWith(VALID_EVM, "evm");

    onNext.mockClear();
    rerender(<Step1Address onNext={onNext} />);
    const input2 = screen.getByPlaceholderText(/0x\.\.\. or algorand address/i);
    fireEvent.change(input2, { target: { value: VALID_ALGO } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onNext).toHaveBeenCalledWith(VALID_ALGO, "algorand");
  });

  it("submits on Enter when valid", () => {
    const onNext = vi.fn();
    render(<Step1Address onNext={onNext} />);
    const input = screen.getByPlaceholderText(/0x\.\.\. or algorand address/i);
    fireEvent.change(input, { target: { value: VALID_EVM } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onNext).toHaveBeenCalledWith(VALID_EVM, "evm");
  });
});
