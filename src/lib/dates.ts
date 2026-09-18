import { Timestamp } from 'firebase/firestore';

/**
 * Converts a JS Date into a "YYYY-MM-DD" key using LOCAL date components
 * (not UTC), so it always matches the calendar day shown on screen.
 */
export function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a "YYYY-MM-DD" date key into a Firestore Timestamp representing
 * LOCAL midnight on that calendar day. Local midnight is safe here because
 * India uses a single fixed UTC+5:30 offset with no DST — there is no
 * scenario where this shifts the stored day.
 */
export function dateKeyToTimestamp(dateKey: string): Timestamp {
  const [year, month, day] = dateKey.split('-').map(Number);
  const localMidnight = new Date(year, month - 1, day, 0, 0, 0, 0);
  return Timestamp.fromDate(localMidnight);
}

/**
 * Formats a raw "YYYY-MM-DD" date key (as passed through navigation params)
 * into a human-readable string, e.g. "Mon Sep 15 2026".
 */
export function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toDateString();
}

/**
 * Formats a booking's stored `date` field for display, whether it's a
 * Firestore Timestamp (new bookings) or a legacy plain string (old bookings
 * created before Timestamps were introduced).
 */
export function formatBookingDate(dateValue: unknown): string {
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate().toDateString();
  }
  if (typeof dateValue === 'string') {
    return dateValue;
  }
  return '';
}