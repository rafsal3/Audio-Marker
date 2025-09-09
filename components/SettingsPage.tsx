
import React, { useState, useRef } from 'react';
import { CustomAssetType } from '../types';
import { BackIcon, PlusIcon, TrashIcon, ImportIcon, ExportIcon, CheckIcon } from './icons';
import { useDialog } from '../contexts/DialogProvider';

interface SettingsPageProps {
  assetTypes: CustomAssetType[];
  onUpdateAssetTypes: (newTypes: CustomAssetType[]) => void;
  onBack: () => void;
}

const TAILWIND_COLORS = [
    'bg-slate-500', 'bg-gray-500', 'bg-zinc-500', 'bg-neutral-500', 'bg-stone-500',
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500',
    'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
    'bg-pink-500', 'bg-rose-500',
];

const SettingsPage: React.FC<SettingsPageProps> = ({ assetTypes, onUpdateAssetTypes, onBack }) => {
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState(TAILWIND_COLORS[5]);
  const importFileRef = useRef<HTMLInputElement>(null);
  const dialog = useDialog();

  const handleAddType = () => {
    if (!newTypeName.trim()) {
        dialog.alert({ title: 'Invalid Name', message: 'Please enter a name for the new asset type.' });
        return;
    }
    if (assetTypes.some(t => t.name.toLowerCase() === newTypeName.trim().toLowerCase())) {
        dialog.alert({ title: 'Duplicate Name', message: 'An asset type with this name already exists. Please choose a unique name.' });
        return;
    }
    const newType: CustomAssetType = {
        id: `type_${Date.now()}`,
        name: newTypeName.trim(),
        color: newTypeColor,
    };
    onUpdateAssetTypes([...assetTypes, newType]);
    setNewTypeName('');
  };

  const handleUpdateType = (id: string, field: 'name' | 'color', value: string) => {
    if (field === 'name' && value.trim() === '') return;
    
    if (field === 'name' && assetTypes.some(t => t.id !== id && t.name.toLowerCase() === value.trim().toLowerCase())) {
      dialog.alert({ title: 'Duplicate Name', message: 'An asset type with this name already exists.'});
      return;
    }
    const updatedTypes = assetTypes.map(t => t.id === id ? { ...t, [field]: value.trim() } : t);
    onUpdateAssetTypes(updatedTypes);
  };
  
  const handleDeleteType = async (id: string) => {
    const confirmed = await dialog.warning({
        title: 'Delete Asset Type?',
        message: 'Are you sure you want to delete this asset type? This might affect existing markers using this type.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
    });

    if (confirmed) {
        onUpdateAssetTypes(assetTypes.filter(t => t.id !== id));
    }
  };
  
  const handleExportSettings = () => {
    const jsonString = JSON.stringify(assetTypes, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'audio_marker_settings.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedTypes = JSON.parse(text);
        if (Array.isArray(importedTypes) && importedTypes.every(t => t.id && t.name && t.color)) {
          onUpdateAssetTypes(importedTypes);
          dialog.alert({ title: 'Success', message: 'Settings imported successfully.' });
        } else {
          throw new Error('Invalid file format.');
        }
      } catch (error) {
        dialog.alert({ title: 'Import Failed', message: 'Failed to import settings. Please check that the JSON file is correctly formatted.' });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="p-8 lg:p-12 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-10">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
          <BackIcon />
          Back to Projects
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <div className="flex items-center gap-2">
            <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"><ImportIcon className="w-4 h-4" /> Import</button>
            <button onClick={handleExportSettings} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"><ExportIcon className="w-4 h-4"/> Export</button>
            <input type="file" ref={importFileRef} onChange={handleImportFile} className="hidden" accept=".json" />
        </div>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Custom Asset Types</h2>
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
            {assetTypes.map(type => (
              <div key={type.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-100">
                <div className={`w-6 h-6 rounded-md ${type.color}`}></div>
                <input
                  type="text"
                  value={type.name}
                  onChange={(e) => handleUpdateType(type.id, 'name', e.target.value)}
                  className="flex-grow bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none"
                />
                <button onClick={() => handleDeleteType(type.id)} className="p-2 text-gray-500 rounded-md hover:bg-red-100 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
              </div>
            ))}
             {assetTypes.length === 0 && <p className="text-center text-gray-500 py-4">No asset types defined. Add one below to get started.</p>}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Type</h2>
          <div className="p-4 bg-gray-50 rounded-lg border flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="New asset type name..."
                value={newTypeName}
                onChange={e => setNewTypeName(e.target.value)}
                className="flex-grow bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
              />
              <button onClick={handleAddType} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                <PlusIcon className="w-5 h-5" /> Add
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="grid grid-cols-11 gap-2">
                {TAILWIND_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewTypeColor(color)}
                    className={`relative w-full aspect-square rounded-md ${color}`}
                    aria-label={`Select color ${color}`}
                  >
                    {newTypeColor === color && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md">
                            <CheckIcon className="w-6 h-6 text-white" />
                        </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
