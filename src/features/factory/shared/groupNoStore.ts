const STORAGE_KEY = "deluxe-veneers-group-no-sequence";

type GroupNoStore = {
  sequence: number;
};

let memoryStore: GroupNoStore | null = null;

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function readStore(): GroupNoStore {
  if (memoryStore) {
    return memoryStore;
  }

  const storage = getLocalStorage();
  if (!storage) {
    memoryStore = { sequence: 0 };
    return memoryStore;
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    memoryStore = { sequence: 0 };
    return memoryStore;
  }

  try {
    const parsed = JSON.parse(raw) as GroupNoStore;
    memoryStore = {
      sequence: Number(parsed?.sequence) || 0,
    };
  } catch {
    memoryStore = { sequence: 0 };
  }

  return memoryStore;
}

function writeStore(next: GroupNoStore) {
  memoryStore = next;
  const storage = getLocalStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}

function formatGroupNo(sequence: number) {
  const year = new Date().getFullYear();
  return `GRP-${year}-${String(sequence).padStart(4, "0")}`;
}

/**
 * Allocate the next Group No. for a new Grouping record.
 * Call only while creating Grouping — never regenerate in later processes.
 */
export function allocateNextGroupNo() {
  const store = readStore();
  const sequence = store.sequence + 1;
  writeStore({ sequence });
  return formatGroupNo(sequence);
}

/** Peek without consuming a sequence number (for display before save). */
export function peekNextGroupNo(offset = 0) {
  return formatGroupNo(readStore().sequence + 1 + Math.max(0, offset));
}

/** Update sequence if an assigned group number has a higher sequence. */
export function syncGroupNoSequence(groupNo: string) {
  const match = /^GRP-\d{4}-(\d+)$/i.exec(groupNo.trim());
  if (match && match[1]) {
    const seq = parseInt(match[1], 10);
    const store = readStore();
    if (seq > store.sequence) {
      writeStore({ sequence: seq });
    }
  }
}



export function isGroupNoValue(value: unknown): value is string {
  return typeof value === "string" && /^GRP-\d{4}-\d{4}$/i.test(value.trim());
}

export function getExistingGroupNo(
  source: Record<string, unknown> | null | undefined,
) {
  if (!source) {
    return "";
  }

  const value = source.groupNo;
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "";
}
