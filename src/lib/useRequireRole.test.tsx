import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { hasRole } from "./auth";
import { useRequireRole } from "./useRequireRole";

vi.mock("./auth", () => ({
  hasRole: vi.fn(),
}));

const mockRouter = { replace: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

function Probe({ rol, destino }: { rol: "ADMIN"; destino?: string }) {
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
});
