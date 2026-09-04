import { content as deContent } from '../data/content/de';
import { content as enContent } from '../data/content/en';
import { content as frContent } from '../data/content/fr';
import type { Content } from '../data/content/de';
import type {
  BoardOffLevel,
  BoardOffSlot,
  BoardOffSlotBase,
  ChecklistItem,
  Exercise,
  Lang,
  MobilityChecklistTemplate,
  SessionTemplate
} from '../types';

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown> ? DeepPartial<T[K]> : T[K];
};

const catalogs: Record<Lang, DeepPartial<Content>> = {
  de: deContent,
  en: enContent,
  fr: frContent
};

/** Übersetztes Feld für `lang`, sonst der deutsche Seed-Wert (`fallback`). */
function pick(value: string | undefined, fallback: string): string {
  return value ?? fallback;
}

/** Übersetzt nur `name`; für `lang === 'de'` referenzielle Gleichheit. */
export function localizeExercise(exercise: Exercise, lang: Lang): Exercise {
  if (lang === 'de') return exercise;
  const name = catalogs[lang].exercises?.[exercise.id]?.name;
  return name ? { ...exercise, name } : exercise;
}

/** Übersetzt `title`, `subtitle` und die `note` je `TemplateExercise`. */
export function localizeTemplate(template: SessionTemplate, lang: Lang): SessionTemplate {
  if (lang === 'de') return template;
  const entry = catalogs[lang].templates?.[template.type];
  if (!entry) return template;
  return {
    ...template,
    title: pick(entry.title, template.title),
    subtitle: pick(entry.subtitle, template.subtitle),
    exercises: template.exercises.map((item) =>
      item.note && entry.notes?.[item.exerciseId]
        ? { ...item, note: entry.notes[item.exerciseId] }
        : item
    )
  };
}

interface MobilityItemText {
  label?: string;
  purpose?: string;
  dose?: string;
  cue?: string;
  cueDetail?: string;
}

function localizeChecklistItem(item: ChecklistItem, translated?: MobilityItemText): ChecklistItem {
  if (!translated) return item;
  return {
    ...item,
    label: pick(translated.label, item.label),
    purpose: item.purpose === undefined ? undefined : pick(translated.purpose, item.purpose),
    dose: item.dose === undefined ? undefined : pick(translated.dose, item.dose),
    cue: item.cue === undefined ? undefined : pick(translated.cue, item.cue),
    cueDetail: item.cueDetail === undefined ? undefined : pick(translated.cueDetail, item.cueDetail)
  };
}

/** Übersetzt `title` und je Item `label`, `purpose`, `dose`, `cue`, `cueDetail`. */
export function localizeMobility(template: MobilityChecklistTemplate, lang: Lang): MobilityChecklistTemplate {
  if (lang === 'de') return template;
  const entry = catalogs[lang].mobility?.[template.variant];
  if (!entry) return template;
  return {
    ...template,
    title: pick(entry.title, template.title),
    items: template.items.map((item) => localizeChecklistItem(item, entry.items?.[item.id]))
  };
}

function localizeSlotBase<T extends BoardOffSlotBase>(slot: T, translated?: { mistake?: string; regression?: string }): T {
  if (!translated) return slot;
  return {
    ...slot,
    mistake: pick(translated.mistake, slot.mistake),
    regression: pick(translated.regression, slot.regression)
  };
}

/** Übersetzt `label`/`skill`/`gate` und je Slot `mistake`/`regression` (inkl. `rigFreeAlternative`). */
export function localizeBoardOffLevel(level: BoardOffLevel, lang: Lang): BoardOffLevel {
  if (lang === 'de') return level;
  const entry = catalogs[lang].boardOff?.[String(level.level)];
  if (!entry) return level;
  return {
    ...level,
    label: pick(entry.label, level.label),
    skill: entry.skill ?? level.skill,
    gate: pick(entry.gate, level.gate),
    slots: level.slots.map((slot): BoardOffSlot => {
      const localized = localizeSlotBase(slot, entry.slots?.[slot.exerciseId]);
      return slot.rigFreeAlternative
        ? { ...localized, rigFreeAlternative: localizeSlotBase(slot.rigFreeAlternative, entry.rigFree?.[slot.exerciseId]) }
        : localized;
    })
  };
}
