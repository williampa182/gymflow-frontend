import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { usePageTitle } from "./usePageTitle";

function Titulo({ t }: { t: string }) {
  usePageTitle(t);
  return null;
}

describe("usePageTitle", () => {
  it("setea document.title con el sufijo GymFlow", () => {
    document.title = "GymFlow";
    render(<Titulo t="Planes" />);
    expect(document.title).toBe("Planes | GymFlow");
  });

  it("restaura el título previo al desmontar", () => {
    document.title = "GymFlow";
    const { unmount } = render(<Titulo t="Usuarios" />);
    expect(document.title).toBe("Usuarios | GymFlow");
    unmount();
    expect(document.title).toBe("GymFlow");
  });
});
