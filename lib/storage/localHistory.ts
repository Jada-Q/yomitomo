import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryEntry {
  id: string;
  ocrText: string;
  summary: string | null;
  documentType: string | null;
  detectedLanguage: 'ja' | 'zh' | 'en' | 'unknown';
  createdAt: number;
}

const STORAGE_KEY = 'yomitomo_history';
const MAX_ENTRIES = 100;

/**
 * Get all history entries (newest first)
 */
export async function getHistory(): Promise<HistoryEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

/**
 * Add a new entry to history
 */
export async function addToHistory(entry: HistoryEntry): Promise<void> {
  const existing = await getHistory();
  const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Delete a history entry by ID
 */
export async function deleteFromHistory(id: string): Promise<void> {
  const existing = await getHistory();
  const updated = existing.filter((e) => e.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
