import { render, screen } from "@testing-library/react";
import StatCard from "@/components/ui/StatCard";

describe("StatCard", () => {
  it("renders with label and value", () => {
    render(<StatCard label="Test Label" value="100" />);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders with icon", () => {
    const Icon = () => <span data-testid="icon">Icon</span>;
    render(<StatCard label="Test Label" value="100" icon={<Icon />} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders with unit", () => {
    render(<StatCard label="Test Label" value="100" unit="km" />);
    expect(screen.getByText("km")).toBeInTheDocument();
  });

  it("renders with trend", () => {
    render(<StatCard label="Test Label" value="100" trend="+10%" />);
    expect(screen.getByText("+10%")).toBeInTheDocument();
  });
});

