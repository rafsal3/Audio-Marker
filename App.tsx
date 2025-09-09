
import React, { useState, useCallback, useEffect } from 'react';
import { Project, CustomAssetType } from './types';
import { DUMMY_PROJECTS, DEFAULT_ASSET_TYPES } from './constants';
import ProjectListPage from './components/ProjectListPage';
import ProjectEditorPage from './components/ProjectEditorPage';
import SettingsPage from './components/SettingsPage';
import { DialogProvider } from './contexts/DialogProvider';

type View = 'list' | 'editor' | 'settings';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const savedProjects = localStorage.getItem('projects');
      if (savedProjects) {
        return JSON.parse(savedProjects);
      }
    } catch (e) {
      console.error("Failed to parse projects from localStorage", e);
    }
    return DUMMY_PROJECTS;
  });
  
  const [assetTypes, setAssetTypes] = useState<CustomAssetType[]>(() => {
    try {
      const savedAssetTypes = localStorage.getItem('assetTypes');
      if (savedAssetTypes) {
        return JSON.parse(savedAssetTypes);
      }
    } catch (e) {
      console.error("Failed to parse asset types from localStorage", e);
    }
    return DEFAULT_ASSET_TYPES;
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [view, setView] = useState<View>('list');

  useEffect(() => {
    const projectsToSave = projects.map(p => {
      const { audioUrl, ...projectData } = p; // Strip temporary blob URL before saving
      return projectData;
    });
    localStorage.setItem('projects', JSON.stringify(projectsToSave));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('assetTypes', JSON.stringify(assetTypes));
  }, [assetTypes]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setView('editor');
  };

  const handleBackToList = () => {
    setSelectedProjectId(null);
    setView('list');
  };

  const handleGoToSettings = () => {
    setView('settings');
  };
  
  const handleCreateNewProject = () => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      title: 'Untitled Project',
      duration: 0,
      markers: [],
      audioFileName: 'No audio imported'
    };
    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    setView('editor');
  };

  const handleUpdateProject = useCallback((updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  }, []);

  const handleUpdateAssetTypes = (newAssetTypes: CustomAssetType[]) => {
    if (Array.isArray(newAssetTypes) && newAssetTypes.every(t => t.id && t.name && t.color)) {
      setAssetTypes(newAssetTypes);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const renderContent = () => {
    switch (view) {
      case 'editor':
        if (!selectedProject) {
          setView('list');
          return null;
        }
        return (
          <ProjectEditorPage
            project={selectedProject}
            onBack={handleBackToList}
            onUpdateProject={handleUpdateProject}
            assetTypes={assetTypes}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            assetTypes={assetTypes}
            onUpdateAssetTypes={handleUpdateAssetTypes}
            onBack={handleBackToList}
          />
        );
      case 'list':
      default:
        return (
          <ProjectListPage
            projects={projects}
            assetTypes={assetTypes}
            onSelectProject={handleSelectProject}
            onCreateNewProject={handleCreateNewProject}
            onGoToSettings={handleGoToSettings}
          />
        );
    }
  };

  return (
    <DialogProvider>
      <div className="min-h-screen bg-white font-sans text-gray-800">
        {renderContent()}
      </div>
    </DialogProvider>
  );
};

export default App;
