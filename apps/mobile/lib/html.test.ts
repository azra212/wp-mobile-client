import { describe, expect, it } from "vitest";
import { stripHtml } from "./html";

describe("stripHtml", () => {
  it("drops tags and surrounding whitespace", () => {
    expect(stripHtml("  <p>Hello <strong>there</strong></p>  ")).toBe("Hello there");
  });

  it("leaves text without tags unchanged", () => {
    expect(stripHtml("No tags")).toBe("No tags");
  });
});
