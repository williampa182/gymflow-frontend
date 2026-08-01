import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Select, type SelectOption } from "./Select";

const opciones: SelectOption[] = [
  { value: "a", label: "Opción A" },
  { value: "b", label: "Opción B" },
  { value: "c", label: "Opción C" },
];

function Wrapper({ value = "" }: { value?: string }) {
  return (
    <Select
      value={value}
      onChange={vi.fn()}
      options={opciones}
      ariaLabel="Selector de prueba"
    />
  );
}

// Nota: role="option" también coincide con las <option> del <select> nativo
// sr-only, así que las queries de opciones se escopan dentro del listbox
// con within(...).

describe("Select: navegación por teclado (roving focus)", () => {
  it("al abrir, mueve el foco a la opción seleccionada (o la primera si no hay selección)", () => {
    render(<Wrapper value="b" />);
    fireEvent.click(screen.getByRole("button"));

    const lista = within(screen.getByRole("listbox"));
    const opcionB = lista.getByRole("option", { name: "Opción B" });
    expect(opcionB).toHaveFocus();
    expect(opcionB).toHaveAttribute("tabindex", "0");
  });

  it("ArrowDown / ArrowUp mueven el foco entre opciones con clamp en los extremos", () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByRole("button"));

    const listboxEl = screen.getByRole("listbox");
    const lista = within(listboxEl);
    const [opA, opB, opC] = lista.getAllByRole("option");

    expect(opA).toHaveFocus();

    fireEvent.keyDown(listboxEl, { key: "ArrowDown" });
    expect(opB).toHaveFocus();
    expect(opA).toHaveAttribute("tabindex", "-1");
    expect(opB).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(listboxEl, { key: "ArrowDown" });
    expect(opC).toHaveFocus();

    // Clamp: no hay wrap-around al llegar al final.
    fireEvent.keyDown(listboxEl, { key: "ArrowDown" });
    expect(opC).toHaveFocus();

    fireEvent.keyDown(listboxEl, { key: "ArrowUp" });
    expect(opB).toHaveFocus();
  });

  it("Home / End mueven el foco a la primera/última opción", () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByRole("button"));

    const listboxEl = screen.getByRole("listbox");
    const lista = within(listboxEl);
    const [opA, , opC] = lista.getAllByRole("option");

    fireEvent.keyDown(listboxEl, { key: "End" });
    expect(opC).toHaveFocus();

    fireEvent.keyDown(listboxEl, { key: "Home" });
    expect(opA).toHaveFocus();
  });

  it("Enter selecciona la opción con foco activo (no la del evento individual)", () => {
    const onChange = vi.fn();
    render(
      <Select
        value=""
        onChange={onChange}
        options={opciones}
        ariaLabel="Selector de prueba"
      />
    );
    fireEvent.click(screen.getByRole("button"));

    const listboxEl = screen.getByRole("listbox");
    fireEvent.keyDown(listboxEl, { key: "ArrowDown" }); // foco -> Opción B
    fireEvent.keyDown(listboxEl, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("b");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("Espacio también selecciona la opción con foco activo", () => {
    const onChange = vi.fn();
    render(
      <Select
        value=""
        onChange={onChange}
        options={opciones}
        ariaLabel="Selector de prueba"
      />
    );
    fireEvent.click(screen.getByRole("button"));

    const listboxEl = screen.getByRole("listbox");
    fireEvent.keyDown(listboxEl, { key: " " });

    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("al cerrar (Escape), el foco vuelve al botón que abre el desplegable", () => {
    render(<Wrapper />);
    const boton = screen.getByRole("button");
    fireEvent.click(boton);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(boton).toHaveFocus();
  });

  it("al seleccionar una opción, el foco vuelve al botón", () => {
    render(<Wrapper />);
    const boton = screen.getByRole("button");
    fireEvent.click(boton);

    const opcionA = within(screen.getByRole("listbox")).getByRole("option", {
      name: "Opción A",
    });
    fireEvent.click(opcionA);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(boton).toHaveFocus();
  });
});
