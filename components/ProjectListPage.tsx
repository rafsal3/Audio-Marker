
import React from 'react';
import { Project, CustomAssetType } from '../types';
import ProjectCard from './ProjectCard';
import { ImportIcon, PlusIcon, SettingsIcon } from './icons';

interface ProjectListPageProps {
  projects: Project[];
  assetTypes: CustomAssetType[];
  onSelectProject: (projectId: string) => void;
  onCreateNewProject: () => void;
  onGoToSettings: () => void;
}

const ProjectListPage: React.FC<ProjectListPageProps> = ({ projects, assetTypes, onSelectProject, onCreateNewProject, onGoToSettings }) => {
  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">All Projects</h1>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors">
            <ImportIcon className="w-4 h-4" />
            Import
          </button>
          <button onClick={onGoToSettings} className="p-2 text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors" aria-label="Settings">
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>
      <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {projects.map(project => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            assetTypes={assetTypes}
            onSelect={() => onSelectProject(project.id)} />
        ))}
        <div 
          className="flex flex-col items-center justify-center aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:bg-gray-100 hover:border-gray-400 cursor-pointer transition-colors"
          onClick={onCreateNewProject}
        >
          <PlusIcon className="w-8 h-8 mb-2" />
          <span className="font-semibold">New</span>
        </div>
      </main>
    </div>
  );
};

export default ProjectListPage;