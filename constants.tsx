
import React from 'react';
import { Project, AssetStatus, Marker, CustomAssetType } from './types';

export const DEFAULT_ASSET_TYPES: CustomAssetType[] = [
  { id: 'type_1', name: 'Image', color: 'bg-red-500' },
  { id: 'type_2', name: 'Video', color: 'bg-purple-500' },
  { id: 'type_3', name: 'Motion Graphics', color: 'bg-teal-500' },
];

export const ASSET_STATUS_COLORS: { [key in AssetStatus]: string } = {
  [AssetStatus.Done]: 'bg-green-500',
  [AssetStatus.InProgress]: 'bg-orange-500',
  [AssetStatus.ToDo]: 'bg-gray-400',
};

const DUMMY_MARKERS_1: Marker[] = [
  { id: 'm1', timestamp: 5, context: 'Opening shot, wide angle', type: 'Image', status: AssetStatus.Done },
  { id: 'm2', timestamp: 15, context: 'Interview clip with subject A', type: 'Video', status: AssetStatus.Done },
  { id: 'm3', timestamp: 28, context: 'Lower third for subject A', type: 'Motion Graphics', status: AssetStatus.InProgress },
  { id: 'm4', timestamp: 45, context: 'B-roll footage of city', type: 'Video', status: AssetStatus.Done },
  { id: 'm5', timestamp: 63, context: 'Archival photo of event', type: 'Image', status: AssetStatus.ToDo },
];

const DUMMY_MARKERS_2: Marker[] = [
  { id: 'm6', timestamp: 12, context: 'Intro graphics sequence', type: 'Motion Graphics', status: AssetStatus.Done },
  { id: 'm7', timestamp: 33, context: 'Close-up shot of hands working', type: 'Image', status: AssetStatus.InProgress },
];


export const DUMMY_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    title: 'The Mountain Story',
    duration: 245,
    markers: DUMMY_MARKERS_1,
    audioFileName: 'mountain_story_vo.mp3'
  },
  {
    id: 'proj_2',
    title: 'Urban Jungle',
    duration: 188,
    markers: DUMMY_MARKERS_2,
    audioFileName: 'urban_jungle_mix.mp3'
  },
  {
    id: 'proj_3',
    title: 'Ocean Deep',
    duration: 320,
    markers: [],
    audioFileName: 'ocean_deep_sfx.mp3'
  },
  {
    id: 'proj_4',
    title: 'A Creator\'s Journey',
    duration: 150,
    markers: DUMMY_MARKERS_1.slice(0,2),
    audioFileName: 'creators_podcast.wav'
  },
];