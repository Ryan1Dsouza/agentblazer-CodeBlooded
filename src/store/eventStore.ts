// ============================================================
//  AgentBlazer — Shared Event Store
//  Single source of truth for admin-created events.
//  Both /admin and /community read/write through this module.
// ============================================================

export type EventCategory =
  | 'Workshop'
  | 'Seminar'
  | 'Hackathon'
  | 'Competition'
  | 'Technical Event'
  | 'Club Event'
  | 'Other';

export type EventStatus = 'draft' | 'published';

export interface AdminEvent {
  id: string;
  title: string;
  description: string;
  date: string;           // ISO date: "YYYY-MM-DD"
  startTime: string;      // "HH:MM"
  endTime: string;        // "HH:MM"
  location: string;
  category: EventCategory;
  image: string;          // URL or empty string
  registrationLink: string;
  status: EventStatus;
  createdAt: number;      // Date.now()
  updatedAt: number;
}

const STORAGE_KEY = 'agentblazer_events';

export function getEvents(): AdminEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminEvent[]) : [];
  } catch {
    return [];
  }
}

export function saveEvents(events: AdminEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function getPublishedEvents(): AdminEvent[] {
  return getEvents()
    .filter((e) => e.status === 'published')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function createEvent(data: Omit<AdminEvent, 'id' | 'createdAt' | 'updatedAt'>): AdminEvent {
  const now = Date.now();
  const newEvent: AdminEvent = {
    ...data,
    id: `evt_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };
  const events = getEvents();
  saveEvents([newEvent, ...events]);
  return newEvent;
}

export function updateEvent(id: string, data: Partial<Omit<AdminEvent, 'id' | 'createdAt'>>): AdminEvent | null {
  const events = getEvents();
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  events[idx] = { ...events[idx], ...data, updatedAt: Date.now() };
  saveEvents(events);
  return events[idx];
}

export function deleteEvent(id: string): void {
  const events = getEvents().filter((e) => e.id !== id);
  saveEvents(events);
}

export function publishEvent(id: string): AdminEvent | null {
  return updateEvent(id, { status: 'published' });
}

export function unpublishEvent(id: string): AdminEvent | null {
  return updateEvent(id, { status: 'draft' });
}

export const EVENT_CATEGORIES: EventCategory[] = [
  'Workshop',
  'Seminar',
  'Hackathon',
  'Competition',
  'Technical Event',
  'Club Event',
  'Other',
];
