import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent } from "../setup/test-utils";

/**
 * Example Unit Test
 *
 * This demonstrates:
 * - Component testing with React Testing Library
 * - User interaction simulation
 * - Mocking with vi
 * - Arrange-Act-Assert pattern
 */

// Simple Button component for testing
function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} type="button">
      {children}
    </button>
  );
}

describe("Button Component", () => {
  let mockOnClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClick = vi.fn();
  });

  it("should render button with correct text", () => {
    // Arrange
    renderWithProviders(<Button onClick={mockOnClick}>Click me</Button>);

    // Act
    const button = screen.getByRole("button", { name: /click me/i });

    // Assert
    expect(button).toBeInTheDocument();
  });

  it("should call onClick handler when clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProviders(<Button onClick={mockOnClick}>Click me</Button>);

    // Act
    const button = screen.getByRole("button", { name: /click me/i });
    await user.click(button);

    // Assert
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});

describe("Example utility function tests", () => {
  it("should demonstrate basic assertion", () => {
    // Arrange
    const value = 2 + 2;

    // Assert
    expect(value).toBe(4);
    expect(value).toBeGreaterThan(3);
    expect(value).toBeLessThan(5);
  });

  it("should demonstrate string matching", () => {
    // Arrange
    const message = "Hello World";

    // Assert
    expect(message).toContain("World");
    expect(message).toMatch(/hello/i);
  });

  it("should demonstrate array assertions", () => {
    // Arrange
    const array = [1, 2, 3, 4, 5];

    // Assert
    expect(array).toHaveLength(5);
    expect(array).toContain(3);
    expect(array).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("Example mock tests", () => {
  it("should demonstrate function mocking with vi.fn()", () => {
    // Arrange
    const mockFn = vi.fn().mockReturnValue("mocked value");

    // Act
    const result = mockFn("test");

    // Assert
    expect(result).toBe("mocked value");
    expect(mockFn).toHaveBeenCalledWith("test");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should demonstrate spy with vi.spyOn()", () => {
    // Arrange
    const obj = {
      method: () => "original",
    };
    const spy = vi.spyOn(obj, "method").mockReturnValue("spied");

    // Act
    const result = obj.method();

    // Assert
    expect(result).toBe("spied");
    expect(spy).toHaveBeenCalled();

    // Cleanup
    spy.mockRestore();
  });
});
