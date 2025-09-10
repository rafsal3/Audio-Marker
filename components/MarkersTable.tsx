
import React, { useState, useMemo } from 'react';
import { Marker, AssetStatus, CustomAssetType } from '../types';
import { ASSET_STATUS_COLORS } from '../constants';
import { CheckIcon, ChevronDownIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, XCircleIcon } from './icons';

interface MarkersTableProps {
  markers: Marker[];
  assetTypes: CustomAssetType[];
  onUpdateMarkers: (markers: Marker[]) => void;
  onTimestampClick: (time: number) => void;
}

const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  const milliseconds = Math.round((timeInSeconds - Math.floor(timeInSeconds)) * 100);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
};

const CustomSelect: React.FC<{ 
    options: { value: string; label: string; color: string }[]; 
    value: string; 
    onChange: (value: string) => void;
}> = ({ options, value, onChange }) => {
    const selectedOption = options.find(opt => opt.value === value) || options[0] || { color: 'bg-gray-400' };

    return (
        <div className="relative w-full">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full appearance-none text-white font-semibold py-2 pl-3 pr-8 rounded-md text-sm cursor-pointer border-none focus:outline-none ${selectedOption.color}`}
                disabled={options.length === 0}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <div className={`absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-white`}>
                <ChevronDownIcon />
            </div>
        </div>
    );
};

const MarkersTable: React.FC<MarkersTableProps> = ({ markers, assetTypes, onUpdateMarkers, onTimestampClick }) => {
  const [filter, setFilter] = useState<{ type: string | 'all'; status: AssetStatus | 'all' }>({
    type: 'all',
    status: 'all',
  });
  const [sort, setSort] = useState<{ by: keyof Marker; direction: 'asc' | 'desc' }>({
    by: 'timestamp',
    direction: 'asc',
  });

  const handleMarkerChange = (id: string, field: keyof Marker, value: any) => {
    const newMarkers = markers.map(m => m.id === id ? { ...m, [field]: value } : m);
    onUpdateMarkers(newMarkers);
  };
  
  const handleDeleteMarker = (id: string) => {
    const newMarkers = markers.filter(m => m.id !== id);
    onUpdateMarkers(newMarkers);
  };

  const handleSort = (column: keyof Marker) => {
    const isCurrent = sort.by === column;
    const direction = isCurrent && sort.direction === 'asc' ? 'desc' : 'asc';
    setSort({ by: column, direction });
  };

  const processedMarkers = useMemo(() => {
    let markersToProcess = [...markers];

    // Filtering
    if (filter.type !== 'all') {
      markersToProcess = markersToProcess.filter(m => m.type === filter.type);
    }
    if (filter.status !== 'all') {
      markersToProcess = markersToProcess.filter(m => m.status === filter.status);
    }

    // Sorting
    const sortBy = sort.by;
    markersToProcess.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return markersToProcess;
  }, [markers, filter, sort]);


  const typeOptions = assetTypes.map(type => ({
      value: type.name,
      label: type.name,
      color: type.color,
  }));

  const statusOptions = Object.values(AssetStatus).map(status => ({
      value: status,
      label: status,
      color: ASSET_STATUS_COLORS[status],
  }));
  
  const SortableHeader: React.FC<{ title: string; columnKey: keyof Marker }> = ({ title, columnKey }) => (
    <button onClick={() => handleSort(columnKey)} className="flex items-center gap-1 font-semibold text-gray-500 hover:text-gray-800 transition-colors">
        <span>{title}</span>
        {sort.by === columnKey && (
            sort.direction === 'asc' ? <ArrowUpIcon className="w-3 h-3"/> : <ArrowDownIcon className="w-3 h-3"/>
        )}
    </button>
  );

  const isFiltered = filter.type !== 'all' || filter.status !== 'all';

  return (
    <div className="h-full flex flex-col border border-gray-200 rounded-lg bg-white">
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50/70">
        <span className="text-sm font-semibold text-gray-600 hidden sm:block">Filter by:</span>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <label htmlFor="type-filter" className="text-sm text-gray-500 sr-only">Type</label>
            <select
                id="type-filter"
                value={filter.type}
                onChange={e => setFilter(prev => ({...prev, type: e.target.value}))}
                className="w-full text-sm p-1.5 border-gray-300 rounded-md focus:outline-none"
            >
                <option value="all">All Types</option>
                {assetTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <label htmlFor="status-filter" className="text-sm text-gray-500 sr-only">Status</label>
            <select
                id="status-filter"
                value={filter.status}
                onChange={e => setFilter(prev => ({...prev, status: e.target.value as AssetStatus | 'all'}))}
                className="w-full text-sm p-1.5 border-gray-300 rounded-md focus:outline-none"
            >
                <option value="all">All Statuses</option>
                {Object.values(AssetStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
        <div className="flex-grow" />
        {isFiltered && (
            <button
                onClick={() => setFilter({ type: 'all', status: 'all' })}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-500 self-end"
            >
                <XCircleIcon className="w-4 h-4" /> Clear
            </button>
        )}
      </div>

      <div className="flex-shrink-0 hidden md:grid grid-cols-[100px_1fr_150px_150px_40px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm">
        <SortableHeader title="Timestamp" columnKey="timestamp" />
        <SortableHeader title="Context" columnKey="context" />
        <SortableHeader title="Type" columnKey="type" />
        <SortableHeader title="Status" columnKey="status" />
        <span className="sr-only">Actions</span>
      </div>
      
      <div className="flex-grow overflow-y-auto p-2">
        <div className="md:space-y-0">
          {processedMarkers.map(marker => (
            <div key={marker.id} className="relative group block md:grid md:grid-cols-[100px_1fr_150px_150px_40px] md:gap-4 md:items-center p-3 md:p-2 rounded-lg hover:bg-gray-50 border-b md:border-none last:border-none">
              
              <div className="flex justify-between items-center mb-2 md:mb-0">
                <span className="md:hidden text-sm font-medium text-gray-500">Timestamp</span>
                <button 
                  onClick={() => onTimestampClick(marker.timestamp)}
                  className="px-3 py-2 text-sm font-mono text-red-600 bg-red-100 rounded-md hover:bg-red-200"
                >
                  {formatTime(marker.timestamp)}
                </button>
              </div>

              <div className="mb-2 md:mb-0">
                <label className="md:hidden text-sm font-medium text-gray-500 mb-1 block">Context</label>
                <input
                  type="text"
                  value={marker.context}
                  onChange={e => handleMarkerChange(marker.id, 'context', e.target.value)}
                  className="w-full bg-gray-100 border-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:bg-white"
                />
              </div>
              
              <div className="mb-2 md:mb-0">
                <label className="md:hidden text-sm font-medium text-gray-500 mb-1 block">Type</label>
                <CustomSelect
                  value={marker.type}
                  onChange={(val) => handleMarkerChange(marker.id, 'type', val)}
                  options={typeOptions}
                />
              </div>
              
              <div className="mb-2 md:mb-0">
                <label className="md:hidden text-sm font-medium text-gray-500 mb-1 block">Status</label>
                <div className="flex items-center">
                  {marker.status === AssetStatus.Done ? (
                    <button
                        onClick={() => handleMarkerChange(marker.id, 'status', AssetStatus.InProgress)}
                        className="w-full flex items-center justify-center font-semibold py-2 pl-3 pr-8 rounded-md text-sm text-white bg-green-500 hover:bg-green-600 transition-colors"
                    >
                        <CheckIcon className="w-4 h-4 mr-2" /> Done
                    </button>
                  ) : (
                      <CustomSelect
                          value={marker.status}
                          onChange={(val) => handleMarkerChange(marker.id, 'status', val)}
                          options={statusOptions}
                      />
                  )}
                </div>
              </div>
              
              <div className="absolute top-2 right-2 md:relative md:top-auto md:right-auto flex items-center justify-center">
                <button
                  onClick={() => handleDeleteMarker(marker.id)}
                  className="p-1 text-gray-400 rounded-md hover:bg-red-100 hover:text-red-500 opacity-25 group-hover:opacity-100 md:opacity-0 transition-opacity"
                  aria-label={`Delete marker at ${formatTime(marker.timestamp)}`}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
           {processedMarkers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {markers.length > 0 ? 'No markers match the current filters.' : 'No markers added yet.'}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MarkersTable;
