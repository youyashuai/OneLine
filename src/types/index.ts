export interface ApiConfig {
  endpoint: string;
  model: string;
  apiKey: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  people: Person[];
  expanded?: boolean;
  source?: string; // Added source field for tracking message source
}

export interface Person {
  name: string;
  role?: string;
  color?: string;
}

export interface TimelineData {
  events: TimelineEvent[];
  summary?: string;
}

// Added date filter related types
export type DateFilterOption = 'all' | 'month' | 'halfYear' | 'year' | 'custom';

export interface DateFilterConfig {
  option: DateFilterOption;
  startDate?: Date;
  endDate?: Date;
}
