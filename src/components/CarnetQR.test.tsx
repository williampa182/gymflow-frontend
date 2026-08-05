import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { CarnetQR } from "./CarnetQR";

vi.mock("qrcode", () => ({
  default: {
    toCanvas: vi.fn().mockResolvedValue(undefined),
  },
}));

import QRCode from "qrcode";

describe("CarnetQR", () => {
  it("rasteriza el código a canvas con la lib qrcode", () => {
    render(<CarnetQR valor="ABCDEF1" />);

    expect(QRCode.toCanvas).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      "ABCDEF1",
      expect.objectContaining({ width: 160 })
    );
  });
});