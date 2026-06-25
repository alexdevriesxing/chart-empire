import { describe, expect, it } from "vitest";
import { hashPasswordWithPepper, validatePasswordStrength, verifyPasswordWithPepper } from "../src/shared/passwordCrypto";

describe("account password security", () => {
  const pepper = "test-only-pepper";

  it("hashes with a unique salt and verifies without storing plaintext", async () => {
    const password = "ChartEmpire2026";
    const first = await hashPasswordWithPepper(password, pepper);
    const second = await hashPasswordWithPepper(password, pepper);
    expect(first).not.toBe(second);
    expect(first).not.toContain(password);
    expect(await verifyPasswordWithPepper(password, first, pepper)).toBe(true);
    expect(await verifyPasswordWithPepper("WrongPassword2026", first, pepper)).toBe(false);
  });

  it("enforces minimum password quality", () => {
    expect(() => validatePasswordStrength("short")).toThrow();
    expect(() => validatePasswordStrength("alllowercase123")).toThrow();
    expect(() => validatePasswordStrength("StrongEnough2026")).not.toThrow();
  });
});
