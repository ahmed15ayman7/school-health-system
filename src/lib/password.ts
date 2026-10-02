import { hash, verify } from "@node-rs/argon2";

const opts = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 } as const;

export async function hashPassword(password: string) {
  return hash(password, opts);
}

export async function verifyPassword(hashStr: string, password: string) {
  return verify(hashStr, password).catch(() => false);
}
