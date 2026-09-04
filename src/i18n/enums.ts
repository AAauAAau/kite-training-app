import type { Feel, KiteBoard, KiteWind, PlannedSession, RingsArea, RingsSkill, SessionType, TrainingIntensity } from '../types';
import type { MessageKey } from './de';

// Kleine MessageKey-Mapper für persistierte Codes → Anzeige-Text. Die Komponente
// übersetzt mit `t(...)`. Persistiert bleibt immer der Code.
export const sessionTypeKey = (type: SessionType): MessageKey => `enum.sessionType.${type}`;
export const feelKey = (feel: Feel): MessageKey => `enum.feel.${feel}`;
export const windKey = (wind: KiteWind): MessageKey => `enum.wind.${wind}`;
export const boardKey = (board: KiteBoard): MessageKey => `enum.board.${board}`;
export const locationKey = (location: PlannedSession['location']): MessageKey => `enum.location.${location}`;
export const trainingIntensityKey = (intensity: TrainingIntensity): MessageKey => `enum.trainingIntensity.${intensity}`;
export const kiteIntensityKey = (intensity: TrainingIntensity): MessageKey => `enum.kiteIntensity.${intensity}`;
export const ringsAreaKey = (area: RingsArea): MessageKey => `enum.ringsArea.${area}`;
export const ringsSkillKey = (skill: RingsSkill): MessageKey => `enum.ringsSkill.${skill}`;
