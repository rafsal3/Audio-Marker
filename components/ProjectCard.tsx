
import React, { useMemo } from 'react';
import { Project, CustomAssetType } from '../types';

interface ProjectCardProps {
  project: Project;
  assetTypes: CustomAssetType[];
  onSelect: () => void;
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

const ProjectCard: React.FC<ProjectCardProps> = ({ project, assetTypes, onSelect }) => {
  return (
    <div onClick={onSelect} className="cursor-pointer group">
      <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 group-hover:border-gray-400 transition-colors duration-300">
        <WaveformVisual markers={project.markers} assetTypes={assetTypes} />
      </div>
      <h3 className="text-md font-semibold mt-3 text-gray-800 truncate">{project.title}</h3>
    </div>
  );
};

export default ProjectCard;