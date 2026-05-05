import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Index from "./Index";

vi.mock("@/lib/versionCheck", () => ({
  checkSiteVersion: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

vi.mock("@/hooks/useUsdcBalance", () => ({
  useUsdcBalance: () => ({
    formatted: 1_000_000,
    isLoading: false,
    isError: false,
    isConnected: true,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useBaseWallet", () => ({
  useBaseWallet: () => ({
    wallet: {
      id: "mock",
      name: "Mock Wallet",
      address: `0x${"1".repeat(40)}`,
    },
    status: "connected" as const,
    openConnectModal: vi.fn(),
    disconnect: vi.fn(),
    setStatus: vi.fn(),
    setConnected: vi.fn(),
  }),
}));

vi.mock("@/components/lendpay/Header", () => ({
  Header: () => <div data-testid="mock-header" />,
}));

const VALID_EVM = `0x${"b".repeat(40)}`;

describe("Index wizard", () => {
  it("advances through address → position → amount → connect → confirm for an EVM address", () => {
    render(<Index />);

    const addressInput = screen.getByPlaceholderText(/0x\.\.\. or algorand address/i);
    fireEvent.change(addressInput, { target: { value: VALID_EVM } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByRole("heading", { name: /no position found/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByRole("heading", { name: /choose repayment/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByRole("heading", { name: /connect payment wallet/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByRole("heading", { name: /confirm & execute/i })).toBeInTheDocument();
  });
});
