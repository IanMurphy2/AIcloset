import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { AuthProvider } from "@/features/auth/AuthProvider";
import { OAuthCallbackPage } from "@/features/auth/OAuthCallbackPage";
import { getToken } from "@/lib/auth/token";

/**
 * Sonda que expone la ruta + query actuales para verificar la navegación tras
 * el callback.
 */
function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  );
}

function renderCallback(initialEntry: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
          <Route
            path="/"
            element={
              <>
                <div>Home protegida</div>
                <LocationProbe />
              </>
            }
          />
          <Route path="/login" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("OAuthCallbackPage", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("con token persiste la sesión y navega a /", async () => {
    renderCallback("/auth/callback?token=abc");

    await waitFor(() => {
      expect(screen.getByText("Home protegida")).toBeInTheDocument();
    });

    expect(getToken()).toBe("abc");
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });

  it("sin token navega a /login?error=oauth", async () => {
    renderCallback("/auth/callback");

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/login?error=oauth",
      );
    });

    expect(getToken()).toBeNull();
    expect(screen.queryByText("Home protegida")).not.toBeInTheDocument();
  });

  it("con error y sin token navega a /login?error=oauth", async () => {
    renderCallback("/auth/callback?error=access_denied");

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/login?error=oauth",
      );
    });

    expect(getToken()).toBeNull();
  });
});
