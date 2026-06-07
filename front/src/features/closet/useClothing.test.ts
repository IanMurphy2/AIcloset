import { describe, expect, it } from "vitest";

import { buildClothingPath } from "@/features/closet/useClothing";

describe("buildClothingPath", () => {
  it("no agrega query string sin filtros", () => {
    expect(buildClothingPath({})).toBe("/clothing");
  });

  it("agrega solo los filtros no vacíos", () => {
    expect(buildClothingPath({ category: "remeras" })).toBe(
      "/clothing?category=remeras",
    );
    expect(buildClothingPath({ color: "negro" })).toBe("/clothing?color=negro");
  });

  it("incluye ambos filtros cuando están presentes", () => {
    expect(buildClothingPath({ category: "remeras", color: "negro" })).toBe(
      "/clothing?category=remeras&color=negro",
    );
  });

  it("ignora valores vacíos o de solo espacios", () => {
    expect(buildClothingPath({ category: "   ", color: "" })).toBe("/clothing");
  });

  it("recorta espacios y codifica valores", () => {
    expect(buildClothingPath({ category: "  ropa interior  " })).toBe(
      "/clothing?category=ropa+interior",
    );
  });
});
