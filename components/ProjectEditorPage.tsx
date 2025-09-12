import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Project, Marker, AssetStatus, CustomAssetType } from '../types';
import { BackIcon, EditIcon, ExportIcon, AudioWaveIcon, ImportIcon, ChevronDownIcon, DownloadIcon } from './icons';
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
  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
  
  const handleExportForPremiere = () => {
    if (project.markers.length === 0) {
      dialog.alert({
        title: 'Export Failed',
        message: 'There are no markers in this project to export.',
      });
      return;
    }
  
    const secondsToTimecode = (timeInSeconds: number, frameRate: number = 30): string => {
      const totalFrames = Math.round(timeInSeconds * frameRate);
      const hours = Math.floor(totalFrames / (3600 * frameRate));
      const minutes = Math.floor((totalFrames % (3600 * frameRate)) / (60 * frameRate));
      const seconds = Math.floor((totalFrames % (60 * frameRate)) / frameRate);
      const frames = totalFrames % frameRate;
  
      return [hours, minutes, seconds, frames]
        .map(v => String(v).padStart(2, '0'))
        .join(';');
    };
  
    const header = ['Marker Name', 'Description', 'In', 'Out', 'Duration', 'Marker Type'].join('\t');
  
    const rows = project.markers.map(marker => {
      const timecode = secondsToTimecode(marker.timestamp);
      const markerName = marker.context.replace(/[\t\n\r]/g, ' ');
      const description = marker.type.replace(/[\t\n\r]/g, ' ');
      
      return [
        markerName,
        description,
        timecode,
        timecode,
        '00;00;00;00',
        'Comment'
      ].join('\t');
    });
  
    const tsvContent = [header, ...rows].join('\n');
    const blob = new Blob([tsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.title.replace(/\s/g, '_')}_premiere_markers.csv`);
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
    <div className="flex flex-col h-screen bg-white md:bg-inherit">
      <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
          <BackIcon />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex items-center gap-2 flex-1 justify-center px-2">
          <div className="hidden md:flex items-center gap-2">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="text-lg sm:text-xl font-bold text-center bg-gray-100 rounded-md px-2 -my-1 focus:outline-none w-full max-w-xs"
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 -my-1 hover:bg-gray-100 transition-colors"
                title="Click to edit project title"
              >
                <h1 className="text-lg sm:text-xl font-bold text-center truncate">
                  {project.title}
                </h1>
                <EditIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
              </div>
            )}
          </div>
          <h1 className="md:hidden text-lg font-bold text-center truncate">
            {project.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <button onClick={handleImportMarkersClick} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors">
              <ImportIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
            
            <div ref={exportDropdownRef} className="relative">
              <button 
                onClick={() => setShowExportOptions(prev => !prev)} 
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ExportIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDownIcon className="w-4 h-4 hidden sm:inline" />
              </button>
        
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border border-gray-100">
                  <ul className="py-1">
                    <li>
                      <button 
                        onClick={() => { handleExportMarkers(); setShowExportOptions(false); }} 
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Standard CSV
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => { handleExportForPremiere(); setShowExportOptions(false); }} 
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        For Premiere Pro
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          <button onClick={handleExportMarkers} className="md:hidden p-1 text-gray-600 hover:text-gray-900">
            <DownloadIcon className="w-6 h-6" />
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
      <main className="flex-grow md:p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-0">
        {!project.audioUrl ? (
          <div className="w-full max-w-2xl p-4">
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