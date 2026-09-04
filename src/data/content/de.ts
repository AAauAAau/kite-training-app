// Re-Export der deutschen Seed-Strings als nach ID verschlüsselte Kataloge.
// `src/logic/localize.ts` löst hieraus (Fallback) und aus `en`/`fr` (Übersetzung)
// zur Renderzeit auf. Struktur & IDs bleiben allein in `src/data/seed.ts`.
import { boardOffLevels, exercises, mobilityChecklists, templates } from '../seed';

export interface ExerciseContent {
  name: string;
}

export interface TemplateContent {
  title: string;
  subtitle: string;
  notes: Record<string, string>;
}

export interface MobilityItemContent {
  label: string;
  purpose?: string;
  dose?: string;
  cue?: string;
  cueDetail?: string;
}

export interface MobilityContent {
  title: string;
  items: Record<string, MobilityItemContent>;
}

export interface BoardOffSlotContent {
  mistake: string;
  regression: string;
}

export interface BoardOffContent {
  label: string;
  skill: string | null;
  gate: string;
  slots: Record<string, BoardOffSlotContent>;
  rigFree: Record<string, BoardOffSlotContent>;
}

export interface Content {
  exercises: Record<string, ExerciseContent>;
  templates: Record<string, TemplateContent>;
  mobility: Record<string, MobilityContent>;
  boardOff: Record<string, BoardOffContent>;
}

export const content: Content = {
  exercises: Object.fromEntries(
    exercises.map((exercise) => [exercise.id, { name: exercise.name }])
  ),
  templates: Object.fromEntries(
    templates.map((template) => [template.type, {
      title: template.title,
      subtitle: template.subtitle,
      notes: Object.fromEntries(
        template.exercises
          .filter((item): item is typeof item & { note: string } => Boolean(item.note))
          .map((item) => [item.exerciseId, item.note])
      )
    }])
  ),
  mobility: Object.fromEntries(
    mobilityChecklists.map((checklist) => [checklist.variant, {
      title: checklist.title,
      items: Object.fromEntries(
        checklist.items.map((item) => [item.id, {
          label: item.label,
          purpose: item.purpose,
          dose: item.dose,
          cue: item.cue,
          cueDetail: item.cueDetail
        }])
      )
    }])
  ),
  boardOff: Object.fromEntries(
    boardOffLevels.map((level) => [String(level.level), {
      label: level.label,
      skill: level.skill,
      gate: level.gate,
      slots: Object.fromEntries(
        level.slots.map((slot) => [slot.exerciseId, { mistake: slot.mistake, regression: slot.regression }])
      ),
      rigFree: Object.fromEntries(
        level.slots
          .filter((slot): slot is typeof slot & { rigFreeAlternative: NonNullable<typeof slot.rigFreeAlternative> } => Boolean(slot.rigFreeAlternative))
          .map((slot) => [slot.exerciseId, {
            mistake: slot.rigFreeAlternative.mistake,
            regression: slot.rigFreeAlternative.regression
          }])
      )
    }])
  )
};
