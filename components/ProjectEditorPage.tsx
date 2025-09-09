
import React, { useState, useRef, useCallback } from 'react';
import { Project, Marker, AssetStatus, CustomAssetType } from '../types';
import { BackIcon, EditIcon, ExportIcon, AudioWaveIcon, ImportIcon } from './icons';
import AudioEditor from './AudioEditor';
import { useDialog } from '../contexts/DialogProvider';

interface ProjectEditorPageProps {
  project: Project;
  assetTypes: CustomAssetType[];
  onBack: () => void;
  onUpdateProject: (project: Project) => void;
}

const ProjectEditorPage: React.FC<ProjectEditorPageProps> = ({ project: initialProject, assetTypes, onBack, onUpdateProject }) => {
  const [project, setProject] = useState<Project>(initialProject);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(project.title);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const csvImportInputRef = useRef<HTMLInputElement>(null);
  const dialog = useDialog();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if(title.trim() === '') {
        setTitle(project.title);
        return;
    }
    const updatedProject = { ...project, title: title.trim() };
    setProject(updatedProject);
    onUpdateProject(updatedProject);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    }
  };

  const handleAudioImportClick = () => {
    audioFileInputRef.current?.click();
  };

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio(audioUrl);
      audio.onloadedmetadata = () => {
        const updatedProject = {
          ...project,
          audioUrl,
          audioFileName: file.name,
          duration: audio.duration,
        };
        setProject(updatedProject);
        onUpdateProject(updatedProject);
      };
    }
  };

  const handleProjectDataChange = useCallback((updatedProjectData: Partial<Project>) => {
      const updatedProject = { ...project, ...updatedProjectData };
      setProject(updatedProject);
      onUpdateProject(updatedProject);
  }, [project, onUpdateProject]);

  const handleExportMarkers = () => {
    if (project.markers.length === 0) {
      dialog.alert({
        title: 'Export Failed',
        message: 'There are no markers in this project to export.',
      });
      return;
    }

    const header = ['timestamp', 'context', 'type', 'status'];
    const rows = project.markers.map(marker => {
      // Handle commas and quotes in context by always quoting the field
      const escapedContext = `"${marker.context.replace(/"/g, '""')}"`;
      return [marker.timestamp, escapedContext, marker.type, marker.status].join(',');
    });

    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-t;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.title.replace(/\s/g, '_')}_markers.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportMarkersClick = () => {
    csvImportInputRef.current?.click();
  };

  const handleMarkersFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).slice(1); // Skip header
        const newMarkers: Marker[] = [];
        const validTypes = assetTypes.map(t => t.name);

        lines.forEach((line, index) => {
          if (!line.trim()) return;

          const parts = line.split(',');
          if (parts.length < 4) {
            throw new Error(`Invalid CSV format on line ${index + 2}: Not enough columns.`);
          }
          
          const timestampStr = parts[0];
          const status = parts[parts.length - 1] as AssetStatus;
          const type = parts[parts.length - 2] as string;
          let context = parts.slice(1, parts.length - 2).join(',');

          if (context.startsWith('"') && context.endsWith('"')) {
            context = context.substring(1, context.length - 1).replace(/""/g, '"');
          }
          
          const timestamp = parseFloat(timestampStr);
          if (isNaN(timestamp)) {
            throw new Error(`Invalid timestamp on line ${index + 2}: '${timestampStr}'`);
          }
          if (!validTypes.includes(type)) {
            throw new Error(`Invalid asset type on line ${index + 2}: '${type}'. Must be one of [${validTypes.join(', ')}]`);
          }
          if (!Object.values(AssetStatus).includes(status)) {
            throw new Error(`Invalid status on line ${index + 2}: '${status}'`);
          }
          
          newMarkers.push({
            id: `marker_imported_${Date.now()}_${index}`,
            timestamp,
            context,
            type,
            status,
          });
        });

        const sortedMarkers = newMarkers.sort((a, b) => a.timestamp - b.timestamp);
        handleProjectDataChange({ markers: sortedMarkers });
        
      } catch (error) {
        if (error instanceof Error) {
            dialog.alert({
                title: 'Import Error',
                message: `Failed to import CSV: ${error.message}`
            });
        } else {
            dialog.alert({
                title: 'Import Error',
                message: 'An unknown error occurred while importing the CSV file.'
            });
        }
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };
  
  const needsAudioRelink = project.audioFileName && project.audioFileName !== 'No audio imported' && !project.audioUrl;

  return (
    <div className="flex flex-col h-screen">
      <header className="flex-shrink-0 flex justify-between items-center p-4 lg:p-6 border-b border-gray-200">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
          <BackIcon />
          Back
        </button>
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="text-xl font-bold text-center bg-gray-100 rounded-md px-2 -my-1"
              autoFocus
            />
          ) : (
            <h1 className="text-xl font-bold">{project.title}</h1>
          )}
          <button onClick={() => setIsEditingTitle(!isEditingTitle)} className="text-gray-500 hover:text-gray-800">
            <EditIcon />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleImportMarkersClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors">
            <ImportIcon className="w-4 h-4" />
            Import
          </button>
          <button onClick={handleExportMarkers} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors">
            <ExportIcon className="w-4 h-4" />
            Export
          </button>
          <input
            type="file"
            ref={csvImportInputRef}
            onChange={handleMarkersFileChange}
            className="hidden"
            accept=".csv, text/csv"
          />
        </div>
      </header>
      <main className="flex-grow p-4 lg:p-8 flex flex-col items-center justify-center">
        {!project.audioUrl ? (
          <div className="w-full max-w-2xl">
            {needsAudioRelink && (
              <div className="mb-4 p-4 text-center bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-lg">
                <p className="font-semibold">Your audio file needs to be re-linked.</p>
                <p className="text-sm">To continue, please select <strong>{project.audioFileName}</strong>.</p>
              </div>
            )}
            <button
              onClick={handleAudioImportClick}
              className="w-full flex items-center justify-center gap-3 py-6 px-12 bg-gray-100/80 border-2 border-gray-200 border-dashed rounded-2xl text-gray-600 hover:bg-gray-200/60 hover:border-gray-300 transition-all duration-300"
            >
              <AudioWaveIcon className="w-6 h-6" />
              <span className="text-lg font-semibold">{needsAudioRelink ? 'Select Audio File' : 'Import Audio'}</span>
            </button>
            <input
              type="file"
              ref={audioFileInputRef}
              onChange={handleAudioFileChange}
              className="hidden"
              accept="audio/*"
            />
          </div>
        ) : (
          <AudioEditor 
            project={project} 
            assetTypes={assetTypes}
            onProjectChange={handleProjectDataChange} 
          />
        )}
      </main>
    </div>
  );
};

export default ProjectEditorPage;
