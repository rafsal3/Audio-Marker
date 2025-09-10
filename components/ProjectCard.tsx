
import React, { useMemo } from 'react';
import { Project, CustomAssetType, AssetStatus } from '../types';
import { TrashIcon } from './icons';

interface ProjectCardProps {
  project: Project;
  assetTypes: CustomAssetType[];
  onSelect: () => void;
  onDelete: () => void;
}

const WaveformVisual: React.FC<{ markers: Project['markers'], assetTypes: CustomAssetType[] }> = ({ markers, assetTypes }) => {
  const bars = Array.from({ length: 50 }, (_, i) => Math.random() * 0.8 + 0.2);
  
  const typeColorMap = useMemo(() => 
    assetTypes.reduce((acc, type) => {
      acc[type.name] = type.color;
      return acc;
    }, {} as Record<string, string>), 
  [assetTypes]);

  const markerColors = markers.slice(0, 6).map(m => typeColorMap[m.type] || 'bg-gray-400');

  return (
    <div className="w-full h-full flex flex-col justify-center items-center px-4">
        <div className="w-full h-16 flex items-center justify-between">
            {bars.map((height, i) => (
                <div key={i} className="w-0.5 bg-black" style={{ height: `${height * 100}%` }} />
            ))}
        </div>
        <div className="w-full flex justify-start items-center gap-2 mt-2 px-2">
            {markerColors.map((color, i) => (
                <div key={i} className={`w-4 h-4 ${color} rounded-sm flex items-center justify-center text-white text-xs font-bold`}>!</div>
            ))}
        </div>
    </div>
  );
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, assetTypes, onSelect, onDelete }) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const allMarkersDone = useMemo(() => {
    if (project.markers.length === 0) {
      return false;
    }
    return project.markers.every(marker => marker.status === AssetStatus.Done);
  }, [project.markers]);

  return (
    <div onClick={onSelect} className="cursor-pointer group relative">
      <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 group-hover:border-gray-400 transition-colors duration-300">
        <WaveformVisual markers={project.markers} assetTypes={assetTypes} />
      </div>
      
      {allMarkersDone && (
        <div 
          className="absolute top-3 left-3 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-md"
          title="All markers completed"
        ></div>
      )}

      <h3 className="text-md font-semibold mt-3 text-gray-800 truncate">{project.title}</h3>
      <button 
        onClick={handleDeleteClick} 
        className="absolute top-2 right-2 p-2 bg-white/70 rounded-full text-gray-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100"
        aria-label={`Delete project ${project.title}`}
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ProjectCard;
