import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";

import {
  AUTH_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  hasAccessTokenInSessionStorage,
} from "./authStorageKeys";

function createSessionStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
  };
}

describe("hasAccessTokenInSessionStorage", () => {
  beforeEach(() => {
    (globalThis as { window?: { sessionStorage: ReturnType<typeof createSessionStorage> } }).window = {
      sessionStorage: createSessionStorage(),
    };
  });

  it("is false when session is empty", () => {
    assert.equal(hasAccessTokenInSessionStorage(), false);
  });

  it("is false when only the auth flag is set", () => {
    globalThis.window!.sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
    assert.equal(hasAccessTokenInSessionStorage(), false);
  });

  it("is true when auth flag and access token are set", () => {
    globalThis.window!.sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
    globalThis.window!.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "jwt");
    assert.equal(hasAccessTokenInSessionStorage(), true);
  });
});