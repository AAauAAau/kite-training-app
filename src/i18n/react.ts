import type { Lang } from '../types';
import { useAppStore } from '../store';

/**
 * Abonniert die aktive Sprache aus dem Store, damit React bei einem Sprachwechsel
 * neu rendert. Der eigentliche `t()`-Aufruf bleibt der modulglobale Import.
 */
export function useLang(): Lang {
  return useAppStore((state) => state.settings.lang ?? 'de');
}
