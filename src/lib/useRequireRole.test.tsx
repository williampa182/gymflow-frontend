import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { hasRole } from "./auth";
import { useRequireRole } from "./useRequireRole";
import type { Rol } from "@/types";

vi.mock("./auth", () => ({
  hasRole: vi.fn(),
}));

const mockRouter = { replace: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

function Probe({ rol, destino }: { rol: Rol | Rol[]; destino?: string }) {
  const autorizado = useRequireRole(rol, destino);
  return <p>{autorizado ? "autorizado" : "redirigiendo"}</p>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useRequireRole", () => {
  it("autoriza cuando el rol coincide", () => {
    vi.mocked(hasRole).mockReturnValue(true);
    render(<Probe rol="ADMIN" />);
    expect(screen.getByText("autorizado")).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("redirige al destino por defecto cuando el rol no coincide", () => {
    vi.mocked(hasRole).mockReturnValue(false);
    render(<Probe rol="ADMIN" />);
    expect(screen.getByText("redirigiendo")).toBeInTheDocument();
    expect(mockRouter.replace).toHaveBeenCalledWith("/dashboard");
  });

  it("redirige al destino custom cuando el rol no coincide", () => {
    vi.mocked(hasRole).mockReturnValue(false);
    render(<Probe rol="ADMIN" destino="/login" />);
    expect(mockRouter.replace).toHaveBeenCalledWith("/login");
  });

  it("autoriza cuando el rol actual coincide con uno de varios roles permitidos", () => {
    vi.mocked(hasRole).mockReturnValue(true);

    render(<Probe rol={["ADMIN", "CLIENTE"]} />);

    expect(screen.getByText("autorizado")).toBeInTheDocument();
    expect(hasRole).toHaveBeenCalledWith("ADMIN", "CLIENTE");
  });

  it("redirige cuando el rol actual no coincide con ninguno de varios roles", () => {
    vi.mocked(hasRole).mockReturnValue(false);

    render(<Probe rol={["ADMIN", "CLIENTE"]} />);

    expect(screen.getByText("redirigiendo")).toBeInTheDocument();
    expect(mockRouter.replace).toHaveBeenCalledWith("/dashboard");
  });
});
