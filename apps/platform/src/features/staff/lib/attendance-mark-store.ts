import type { AttendanceStatus } from "./mock-data";

export type AttendanceMarkTarget = {
  staffId: string;
  staffName: string;
  date: string; // yyyy-MM-dd
  status: AttendanceStatus;
  reason?: string;
};

export type AttendanceMarkState = {
  open: boolean;
  target: AttendanceMarkTarget | null;
  onSave: ((status: AttendanceStatus, reason?: string) => void) | null;
};

type Listener = () => void;

let state: AttendanceMarkState = {
  open: false,
  target: null,
  onSave: null,
};

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeAttendanceMark(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAttendanceMarkState() {
  return state;
}

export function openAttendanceMark(input: {
  target: AttendanceMarkTarget;
  onSave: (status: AttendanceStatus, reason?: string) => void;
}) {
  state = { open: true, target: input.target, onSave: input.onSave };
  emit();
}

export function closeAttendanceMark() {
  state = { ...state, open: false };
  emit();
}
