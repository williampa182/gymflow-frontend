import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlateStat } from "./PlateStat";

describe("PlateStat", () => {
  it("renderiza el label y el valor de una estadística", () => {
    render(<PlateStat label="Usuarios activos" value={41} variante="moss" />);

    expect(screen.getByText("Usuarios activos")).toBeInTheDocument();
    expect(screen.getByText("41")).toBeInTheDocument();
  });

  it("oculta el valor restringido y muestra N/A", () => {
    render(
      <PlateStat
        label="Ingresos estimados"
        value={125000}
        variante="hazard"
        restringido
      />
    );

    expect(screen.getByText("Ingresos estimados")).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();
    expect(screen.queryByText("125000")).not.toBeInTheDocument();
    expect(screen.getByText("Solo visible para ADMIN")).toBeInTheDocument();
  });

  it("formatea valores cuando recibe un formateador", () => {
    render(
      <PlateStat
        label="Ingresos estimados"
        value={125000}
        variante="hazard"
        valueFormatter={(value) => `$ ${value.toLocaleString("es-CO")}`}
      />
    );

    expect(screen.getByText("$ 125.000")).toBeInTheDocument();
  });

  it("deja el círculo como indicador decorativo y el valor como texto visible", () => {
    const { container } = render(
      <PlateStat label="Ingresos estimados" value={920000} variante="hazard" />
    );

    expect(container.querySelector('[aria-label*="Ingresos estimados"]')).toBeNull();
    expect(screen.getByText("920000")).toBeInTheDocument();
  });

  it("expone el valor completo como tooltip (title) cuando hay datos", () => {
    render(
      <PlateStat
        label="Ingresos estimados"
        value={920000}
        variante="hazard"
        valueFormatter={(value) => `$ ${value.toLocaleString("es-CO")}`}
      />
    );

    expect(screen.getByTitle("$ 920.000")).toBeInTheDocument();
  });

  it("no agrega tooltip cuando el valor está restringido", () => {
    render(<PlateStat label="Ingresos" value={5} variante="hazard" restringido />);

    expect(screen.queryByTitle("N/A")).not.toBeInTheDocument();
  });
});
