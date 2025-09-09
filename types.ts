export interface CustomAssetType {
  id: string;
  name: string;
  color: string; // Tailwind bg color class e.g. 'bg-red-500'
}

export enum AssetStatus {
  Done = 'Done',
  InProgress = 'In Progress',
  ToDo = 'To Do',
}

export interface Marker {
  id: string;
  timestamp: number; // in seconds
  context: string;
  type: string;
  status: AssetStatus;
}

export interface Project {
  id: string;
  title: string;
  audioUrl?: string;
  audioFileName?: string;
  duration: number;
  markers: Marker[];
}