import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ClothingItem } from "@/features/closet/types";
import {
  createInitialState,
  outfitReducer,
  selectItems,
  useOutfitBuilder,
  type OutfitBuilderState,
} from "@/features/outfit/useOutfitBuilder";

function makeItem(overrides: Partial<ClothingItem> = {}): ClothingItem {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    userId: "user-1",
    imageUrl: "/uploads/sample.png",
    description: "Prenda",
    category: "remeras",
    color: "negro",
    createdAt: "2026-06-05T00:00:00.000Z",
    ...overrides,
  };
}

/** Aplica una secuencia de acciones partiendo del estado inicial. */
function run(...actions: Parameters<typeof outfitReducer>[1][]): OutfitBuilderState {
  return actions.reduce(outfitReducer, createInitialState());
}

describe("outfitReducer", () => {
  it("arranca con todos los slots vacíos y sin orden", () => {
    const state = createInitialState();
    expect(state.order).toEqual([]);
    expect(state.assignments).toEqual({
      tops: null,
      bottoms: null,
      calzado: null,
      abrigo: null,
      accesorios: null,
    });
  });

  it("assign llena el slot y lo agrega al orden", () => {
    const top = makeItem({ id: "t1" });
    const state = run({ type: "assign", slot: "tops", clothing: top });

    expect(state.assignments.tops).toBe(top);
    expect(state.order).toEqual(["tops"]);
  });

  it("assign sobre un slot ocupado reemplaza la prenda y conserva su posición", () => {
    const first = makeItem({ id: "t1" });
    const second = makeItem({ id: "t2" });
    const replacement = makeItem({ id: "t1b" });

    const state = run(
      { type: "assign", slot: "tops", clothing: first },
      { type: "assign", slot: "bottoms", clothing: second },
      { type: "assign", slot: "tops", clothing: replacement },
    );

    expect(state.assignments.tops).toBe(replacement);
    // No se duplica en el orden ni cambia de posición.
    expect(state.order).toEqual(["tops", "bottoms"]);
  });

  it("remove vacía el slot y lo saca del orden", () => {
    const top = makeItem({ id: "t1" });
    const shoe = makeItem({ id: "s1" });

    const state = run(
      { type: "assign", slot: "tops", clothing: top },
      { type: "assign", slot: "calzado", clothing: shoe },
      { type: "remove", slot: "tops" },
    );

    expect(state.assignments.tops).toBeNull();
    expect(state.assignments.calzado).toBe(shoe);
    expect(state.order).toEqual(["calzado"]);
  });

  it("remove sobre un slot vacío no cambia el estado", () => {
    const initial = createInitialState();
    const next = outfitReducer(initial, { type: "remove", slot: "tops" });
    expect(next).toBe(initial);
  });

  it("reorder mueve un slot ocupado y ajusta las posiciones", () => {
    const a = makeItem({ id: "a" });
    const b = makeItem({ id: "b" });
    const c = makeItem({ id: "c" });

    const state = run(
      { type: "assign", slot: "tops", clothing: a },
      { type: "assign", slot: "bottoms", clothing: b },
      { type: "assign", slot: "calzado", clothing: c },
      // Mueve el primero (tops) al final.
      { type: "reorder", from: 0, to: 2 },
    );

    expect(state.order).toEqual(["bottoms", "calzado", "tops"]);
  });

  it("reorder con índices inválidos o iguales no cambia el estado", () => {
    const a = makeItem({ id: "a" });
    const base = run({ type: "assign", slot: "tops", clothing: a });

    expect(outfitReducer(base, { type: "reorder", from: 0, to: 0 })).toBe(base);
    expect(outfitReducer(base, { type: "reorder", from: 0, to: 5 })).toBe(base);
    expect(outfitReducer(base, { type: "reorder", from: -1, to: 0 })).toBe(base);
  });

  it("hydrate precarga slots y orden desde items existentes (modo edición)", () => {
    const top = makeItem({ id: "t1" });
    const shoe = makeItem({ id: "s1" });

    const state = run({
      type: "hydrate",
      items: [
        { slot: "tops", clothing: top },
        { slot: "calzado", clothing: shoe },
      ],
    });

    expect(state.assignments.tops).toBe(top);
    expect(state.assignments.calzado).toBe(shoe);
    expect(state.assignments.bottoms).toBeNull();
    // El orden del array define position.
    expect(state.order).toEqual(["tops", "calzado"]);
    expect(selectItems(state)).toEqual([
      { clothingId: "t1", category: "tops", position: 0 },
      { clothingId: "s1", category: "calzado", position: 1 },
    ]);
  });

  it("hydrate reemplaza por completo el estado previo", () => {
    const a = makeItem({ id: "a" });
    const b = makeItem({ id: "b" });

    const state = run(
      { type: "assign", slot: "bottoms", clothing: a },
      { type: "hydrate", items: [{ slot: "tops", clothing: b }] },
    );

    expect(state.assignments.bottoms).toBeNull();
    expect(state.assignments.tops).toBe(b);
    expect(state.order).toEqual(["tops"]);
  });

  it("reset vuelve al estado inicial", () => {
    const a = makeItem({ id: "a" });
    const state = run(
      { type: "assign", slot: "tops", clothing: a },
      { type: "reset" },
    );
    expect(state).toEqual(createInitialState());
  });
});

describe("selectItems (toItems)", () => {
  it("devuelve items con clothingId/category/position según el orden", () => {
    const top = makeItem({ id: "t1" });
    const bottom = makeItem({ id: "b1" });

    const state = run(
      { type: "assign", slot: "bottoms", clothing: bottom },
      { type: "assign", slot: "tops", clothing: top },
    );

    expect(selectItems(state)).toEqual([
      { clothingId: "b1", category: "bottoms", position: 0 },
      { clothingId: "t1", category: "tops", position: 1 },
    ]);
  });

  it("mantiene una sola prenda por categoría/slot", () => {
    const first = makeItem({ id: "t1" });
    const second = makeItem({ id: "t2" });

    const state = run(
      { type: "assign", slot: "tops", clothing: first },
      { type: "assign", slot: "tops", clothing: second },
    );

    const items = selectItems(state);
    const topsItems = items.filter((i) => i.category === "tops");
    expect(topsItems).toHaveLength(1);
    expect(topsItems[0]?.clothingId).toBe("t2");
  });

  it("recalcula position contigua tras un reorder", () => {
    const a = makeItem({ id: "a" });
    const b = makeItem({ id: "b" });
    const c = makeItem({ id: "c" });

    const state = run(
      { type: "assign", slot: "tops", clothing: a },
      { type: "assign", slot: "bottoms", clothing: b },
      { type: "assign", slot: "calzado", clothing: c },
      { type: "reorder", from: 2, to: 0 },
    );

    expect(selectItems(state).map((i) => ({ id: i.clothingId, pos: i.position }))).toEqual([
      { id: "c", pos: 0 },
      { id: "a", pos: 1 },
      { id: "b", pos: 2 },
    ]);
  });

  it("recalcula position contigua tras quitar un slot del medio", () => {
    const a = makeItem({ id: "a" });
    const b = makeItem({ id: "b" });
    const c = makeItem({ id: "c" });

    const state = run(
      { type: "assign", slot: "tops", clothing: a },
      { type: "assign", slot: "bottoms", clothing: b },
      { type: "assign", slot: "calzado", clothing: c },
      { type: "remove", slot: "bottoms" },
    );

    expect(selectItems(state)).toEqual([
      { clothingId: "a", category: "tops", position: 0 },
      { clothingId: "c", category: "calzado", position: 1 },
    ]);
  });
});

describe("useOutfitBuilder hook", () => {
  it("expone acciones que mutan el estado y toItems() refleja el resultado", () => {
    const { result } = renderHook(() => useOutfitBuilder());

    const top = makeItem({ id: "t1" });
    const bottom = makeItem({ id: "b1" });

    act(() => {
      result.current.assign("tops", top);
      result.current.assign("bottoms", bottom);
    });

    expect(result.current.toItems()).toEqual([
      { clothingId: "t1", category: "tops", position: 0 },
      { clothingId: "b1", category: "bottoms", position: 1 },
    ]);

    act(() => {
      result.current.remove("tops");
    });

    expect(result.current.toItems()).toEqual([
      { clothingId: "b1", category: "bottoms", position: 0 },
    ]);

    act(() => {
      result.current.reset();
    });

    expect(result.current.toItems()).toEqual([]);
  });
});
