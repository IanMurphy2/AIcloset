import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock de la capa de red. Conservamos `ApiError` (el form lo usa para mensajes).
const apiFetchMock = vi.fn();
vi.mock("@/lib/api/client", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/api/client")>(
      "@/lib/api/client",
    );
  return {
    ...actual,
    apiFetch: (...args: unknown[]) => apiFetchMock(...args),
  };
});

// Mock del navigate de react-router para inspeccionar la redirección.
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import { AddClothingForm } from "@/features/closet/AddClothingForm";
import { MAX_IMAGE_SIZE_BYTES } from "@/features/closet/createClothing";
import { renderWithProviders } from "@/test/renderWithProviders";

/** Crea un `File` de un tipo/tamaño dados (rellena con bytes para el size). */
function makeFile({
  name = "prenda.png",
  type = "image/png",
  size = 1024,
} = {}): File {
  const file = new File(["x"], name, { type });
  // jsdom respeta `file.size`; lo sobreescribimos para simular tamaño.
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("AddClothingForm", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    navigateMock.mockReset();
    // jsdom no implementa createObjectURL/revokeObjectURL.
    URL.createObjectURL = vi.fn(() => "blob:preview-url");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el preview al seleccionar un archivo válido", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddClothingForm />, { withRouter: true });

    const input = screen.getByLabelText("Imagen");
    await user.upload(input, makeFile());

    const preview = await screen.findByAltText("Vista previa de la prenda");
    expect(preview).toHaveAttribute("src", "blob:preview-url");
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it("rechaza un archivo de tipo inválido y no llama a la API", async () => {
    renderWithProviders(<AddClothingForm />, { withRouter: true });

    const input = screen.getByLabelText("Imagen");
    // Usamos fireEvent (en vez de userEvent.upload) para inyectar un archivo
    // que NO matchea el atributo `accept` y así ejercitar nuestra validación.
    fireEvent.change(input, {
      target: {
        files: [makeFile({ name: "doc.pdf", type: "application/pdf" })],
      },
    });

    expect(
      await screen.findByText(
        "Formato no válido. Usá una imagen JPG, PNG o WEBP.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByAltText("Vista previa de la prenda")).toBeNull();
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it("rechaza un archivo de más de 5MB y no llama a la API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddClothingForm />, { withRouter: true });

    const input = screen.getByLabelText("Imagen");
    await user.upload(
      input,
      makeFile({ size: MAX_IMAGE_SIZE_BYTES + 1 }),
    );

    expect(
      await screen.findByText("La imagen supera el tamaño máximo de 5 MB."),
    ).toBeInTheDocument();
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it("en submit válido sube la imagen (FormData campo 'image'), crea la prenda e invalida ['clothing']", async () => {
    // 1ra llamada: upload -> { imageUrl }. 2da: create -> prenda.
    apiFetchMock.mockResolvedValueOnce({ imageUrl: "/uploads/abc.png" });
    apiFetchMock.mockResolvedValueOnce({
      id: "new-1",
      userId: "u1",
      imageUrl: "/uploads/abc.png",
      description: "Remera blanca",
      category: "remeras",
      color: "blanco",
      createdAt: "2026-06-06T00:00:00.000Z",
    });

    const user = userEvent.setup();
    const { client } = renderWithProviders(<AddClothingForm />, {
      withRouter: true,
    });
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const file = makeFile();
    await user.upload(screen.getByLabelText("Imagen"), file);
    await user.type(screen.getByLabelText("Descripción"), "Remera blanca");
    await user.type(screen.getByLabelText("Categoría"), "remeras");
    await user.type(screen.getByLabelText("Color"), "blanco");

    await user.click(screen.getByRole("button", { name: "Guardar prenda" }));

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(2));

    // 1) Upload: multipart con FormData que contiene el archivo en campo "image".
    const [uploadPath, uploadOpts] = apiFetchMock.mock.calls[0];
    expect(uploadPath).toBe("/clothing/upload");
    expect(uploadOpts.method).toBe("POST");
    expect(uploadOpts.body).toBeInstanceOf(FormData);
    expect((uploadOpts.body as FormData).get("image")).toBe(file);

    // 2) Create: POST /clothing con imageUrl + datos del form.
    const [createPath, createOpts] = apiFetchMock.mock.calls[1];
    expect(createPath).toBe("/clothing");
    expect(createOpts.method).toBe("POST");
    expect(createOpts.body).toEqual({
      imageUrl: "/uploads/abc.png",
      description: "Remera blanca",
      category: "remeras",
      color: "blanco",
    });

    // 3) En éxito: invalida ['clothing'] y redirige al listado.
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["clothing"] }),
    );
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("muestra un mensaje de error si falla el upload y no redirige", async () => {
    const { ApiError } = await vi.importActual<
      typeof import("@/lib/api/client")
    >("@/lib/api/client");
    apiFetchMock.mockRejectedValueOnce(new ApiError(400, "File too large"));

    const user = userEvent.setup();
    renderWithProviders(<AddClothingForm />, { withRouter: true });

    await user.upload(screen.getByLabelText("Imagen"), makeFile());
    await user.type(screen.getByLabelText("Descripción"), "Remera blanca");
    await user.click(screen.getByRole("button", { name: "Guardar prenda" }));

    expect(await screen.findByText("File too large")).toBeInTheDocument();
    // No se llegó a crear la prenda ni a redirigir.
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
