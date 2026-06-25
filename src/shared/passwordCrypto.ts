const PASSWORD_ITERATIONS = 310_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function passwordMaterial(password: string, pepper: string): ArrayBuffer {
  return toArrayBuffer(new TextEncoder().encode(`${password}\u0000${pepper}`));
}

export async function hashPasswordWithPepper(password: string, pepper: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", passwordMaterial(password, pepper), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: toArrayBuffer(salt), iterations: PASSWORD_ITERATIONS }, key, 256);
  return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(bits))}`;
}

export async function verifyPasswordWithPepper(password: string, encoded: string, pepper: string): Promise<boolean> {
  const [algorithm, iterationText, saltText, expectedText] = encoded.split("$");
  if (algorithm !== "pbkdf2-sha256" || !iterationText || !saltText || !expectedText) return false;
  const iterations = Number(iterationText);
  if (!Number.isInteger(iterations) || iterations < 100_000 || iterations > 1_000_000) return false;
  const key = await crypto.subtle.importKey("raw", passwordMaterial(password, pepper), "PBKDF2", false, ["deriveBits"]);
  const salt = base64ToBytes(saltText);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: toArrayBuffer(salt), iterations }, key, 256);
  const actual = new Uint8Array(bits);
  const expected = base64ToBytes(expectedText);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index]! ^ expected[index]!;
  return difference === 0;
}

export function validatePasswordStrength(password: string): void {
  if (password.length < 12 || password.length > 128) throw new Error("Password must be between 12 and 128 characters.");
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new Error("Password must include uppercase, lowercase, and a number.");
  }
}
