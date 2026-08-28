import type { ChecklistItem, Session, SessionType } from '../types';

const postSessionHipTypes: SessionType[] = ['A', 'B', 'RINGS', 'KB', 'KITE'];

export function offersPostSessionHip(type: SessionType): boolean {
  return postSessionHipTypes.includes(type);
}

export function hipItemsForSession(items: ChecklistItem[], session: Pick<Session, 'entries'>): ChecklistItem[] {
  const copenhagenAlreadyLogged = session.entries.some((entry) => entry.exerciseId === 'copenhagen-plank');
  return copenhagenAlreadyLogged
    ? items.filter((item) => item.id !== 'hip-copenhagen-plank')
    : items;
}
