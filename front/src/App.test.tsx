import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "@/App";

describe("App", () => {
  it("renderiza el título y el botón de ejemplo", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "AI Closet" }),
    ).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Botón de ejemplo" });
    expect(button).toBeInTheDocument();
    // El Button de shadcn renderiza con sus clases de Tailwind/cva.
    expect(button.className).toMatch(/inline-flex|bg-/);
  });
});
