
export enum Tab {
  Dashboard = 'Dashboard',
  Appointments = 'Appointments',
  Medications = 'Medications',
  Tasks = 'Tasks',
  AIInsights = 'AI Insights',
  Settings = 'Settings',
  AboutUs = 'About Us',
}

export enum Recurrence {
    None = 'None',
    Daily = 'Daily',
    Weekly = 'Weekly',
    Monthly = 'Monthly',
    Yearly = 'Yearly',
}

export interface Appointment {
  id: string;
  type: string;
  customType?: string;
  provider: string;
  date: string; // ISO string
  location: string;
  notes: string;
  reminder: number; // minutes before
  recurrence: Recurrence;
  weeklyDays?: number[]; // 0 for Sunday, 1 for Monday, etc.
  monthlyInterval?: number;
  dailyInterval?: number;
  yearlyInterval?: number;
}

export interface Medication {
    id: string;
    name: string;
    dosage: number;
    dosageUnit: string;
    customDosageUnit?: string;
    frequency: string;
    notes: string;
    reminders: string[]; // array of ISO datetime strings
    recurrence: Recurrence;
    weeklyDays?: number[];
    monthlyInterval?: number;
    dailyInterval?: number;
    yearlyInterval?: number;
    streak?: {
        count: number;
        lastTakenDate: string | null;
    };
}

export interface Task {
    id: string;
    title: string;
    notes?: string;
    dueDate: string | null; // ISO string
    isCompleted: boolean;
    recurrence: Recurrence;
    weeklyDays?: number[];
    monthlyInterval?: number;
    dailyInterval?: number;
    yearlyInterval?: number;
    reminder?: number; // minutes before dueDate
}

export interface UserProfile {
    name: string;
    email: string;
    avatar: string;
    notificationSettings: {
        appointments: boolean;
        medications: boolean;
        tasks: boolean;
    };
}

export interface AIInsightData {
    heartRate: string;
    bloodPressure: string;
    activityType: string;
    activityDuration: string;
    sleepHours: string;
    notes: string;
}

export interface AuthUser {
    firstName: string;
    lastName: string;
    email: string;
    password?: string; // only for storage, not for session
}