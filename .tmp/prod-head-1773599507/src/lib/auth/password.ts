import { hash, compare } from "bcryptjs";

const PASSWORD_ROUNDS = 12;

export async function hashPassword(plainTextPassword: string) {
  return hash(plainTextPassword, PASSWORD_ROUNDS);
}

export async function verifyPassword(plainTextPassword: string, passwordHash: string) {
  return compare(plainTextPassword, passwordHash);
}
