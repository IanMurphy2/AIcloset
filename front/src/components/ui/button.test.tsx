import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renderiza el texto dentro de un elemento button", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
  });

  it("aplica las clases base de la variante por defecto", () => {
    render(<Button>Variant</Button>);

    const button = screen.getByRole("button", { name: "Variant" });
    // Confirma que cva/Tailwind renderizan las clases del componente.
    expect(button.className).toMatch(/inline-flex/);
    expect(button.className).toMatch(/bg-primary/);
  });

  it("respeta una variante explícita", () => {
    render(<Button variant="outline">Outline</Button>);

    const button = screen.getByRole("button", { name: "Outline" });
    expect(button.className).toMatch(/border/);
  });
});
