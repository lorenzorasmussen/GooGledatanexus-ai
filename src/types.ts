// types.ts - Shared TypeScript types for the React application

export interface CalendarEvent {
  id: number;
  time: string;
  title: string;
}

export interface Notification {
  id: number;
  message: string;
  timestamp: string; // ISO date string
}

export interface WeatherData {
  temperature: number;
  condition: string;
  location:string;
}

export interface CryptoData {
  pair: string;
  price: string; // Comes as string from API
  change_percent: string; // Comes as string from API
}

// --- Wiki Types ---
export interface WikiPage {
  id: string;
  title: string;
  content_md: string;
  updated_at?: string; 
  created_at?: string; 
}

export interface WikiSearchResultItem {
  id: string;
  title?: string; 
  score?: number; 
}

// Props for Wiki Components
export interface WikiSearchBarProps {
  onQueryChange: (query: string) => void;
  isLoading?: boolean;
  initialQuery: string;
}

export interface WikiSearchResultsProps {
  results: WikiSearchResultItem[];
  onSelectPage: (id: string) => void;
  isLoading?: boolean;
}

export interface WikiPageDisplayProps {
  page: WikiPage | null;
  isLoading?: boolean;
  onEdit: (page: WikiPage) => void;
  onClose: () => void;
}

export interface WikiPageFormProps {
  initialPage?: WikiPage | null; 
  onSave: (pageData: { title: string; content_md: string; id?: string }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

// --- Chat Types ---
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  isStreaming?: boolean; // Optional: to indicate AI message is actively streaming
}

// --- Interaction Log (User <-> AI Developer) ---
export interface InteractionLogEntry {
  id: string;
  timestamp: string;
  userPrompt: string;
  aiResponseSummary: string; // Brief description of what AI did
  aiResponseDetails?: string; // Could be XML changes, or longer explanation
}
