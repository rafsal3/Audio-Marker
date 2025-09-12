import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Project, Marker, AssetStatus, CustomAssetType } from '../types';
import { PlayIcon, PauseIcon, PlusIcon, ChevronDownIcon, ImageIcon, DoubleCheckIcon, DotsVerticalIcon, BookmarkIcon } from './icons';
import MarkersTable from './MarkersTable';
import { useDialog } from '../contexts/DialogProvider';
import { ASSET_STATUS_COLORS } from '../constants';

interface AudioEditorProps {
  project: Project;
  assetTypes: CustomAssetType[];
  onProjectChange: (projectData: Partial<Project>) => void;
}

const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatMobilePlayerTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const deciseconds = Math.floor((timeInSeconds - Math.floor(timeInSeconds)) * 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}${deciseconds}`;
};

const WaveformDisplay: React.FC<{ 
  duration: number, 
  currentTime: number, 
  markers: Marker[], 
  assetTypes: CustomAssetType[],
  onSeek: (time: number) => void 
}> = ({ duration, currentTime, markers, assetTypes, onSeek }) => {
    const waveformRef = useRef<HTMLDivElement>(null);
    const bars = useMemo(() => Array.from({ length: 200 }, () => Math.random() * 0.9 + 0.1), []);

    const typeColorMap = useMemo(() => 
      assetTypes.reduce((acc, type) => {
        acc[type.name] = type.color;
        return acc;
      }, {} as Record<string, string>), 
    [assetTypes]);

    const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!waveformRef.current || duration === 0) return;
        const rect = waveformRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        onSeek(duration * percentage);
    };

    return (
        <div ref={waveformRef} className="relative w-full h-24 bg-gray-800 rounded-xl cursor-pointer" onClick={handleWaveformClick}>
            <div className="absolute inset-0 flex items-center justify-between px-2">
                {bars.map((height, i) => (
                    <div key={i} className="w-[2px] bg-white/50" style={{ height: `${height * 100}%` }} />
                ))}
            </div>
            {/* Playhead */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-blue-500 rounded-full"
                style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute -top-1 -left-1.5 w-4 h-4 bg-blue-500 border-2 border-white rounded-full"></div>
            </div>
             {/* Markers */}
            {markers.map(marker => (
                <div
                    key={marker.id}
                    className={`absolute -bottom-2.5 w-4 h-4 ${typeColorMap[marker.type] || 'bg-gray-400'} rounded-sm flex items-center justify-center text-white text-xs font-bold transform -translate-x-1/2`}
                    style={{ left: `${(marker.timestamp / duration) * 100}%` }}
                    title={`${marker.context} @ ${formatTime(marker.timestamp)}`}
                >
                    !
                </div>
            ))}
        </div>
    );
};


const AudioEditor: React.FC<AudioEditorProps> = ({ project, assetTypes, onProjectChange }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [newMarkerContext, setNewMarkerContext] = useState('');
  const [newMarkerType, setNewMarkerType] = useState<string>(assetTypes[0]?.name || '');
  const [isEditingMobileContext, setIsEditingMobileContext] = useState(false);
  const dialog = useDialog();

  const typeColorMap = useMemo(() => 
    assetTypes.reduce((acc, type) => {
      acc[type.name] = type.color;
      return acc;
    }, {} as Record<string, string>), 
  [assetTypes]);

  useEffect(() => {
    if (assetTypes.length > 0 && !assetTypes.find(t => t.name === newMarkerType)) {
      setNewMarkerType(assetTypes[0].name);
    }
  }, [assetTypes, newMarkerType]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleSeek = (time: number) => {
    if(audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    }
  };

  const handleUpdateMarkers = useCallback((newMarkers: Marker[]) => {
    onProjectChange({ markers: newMarkers });
  }, [onProjectChange]);

  const handleMarkerChange = (id: string, field: keyof Marker, value: any) => {
    const newMarkers = project.markers.map(m => m.id === id ? { ...m, [field]: value } : m);
    handleUpdateMarkers(newMarkers);
  };

  const handleDeleteMarker = async (markerId: string) => {
    const markerToDelete = project.markers.find(m => m.id === markerId);
    if (!markerToDelete) return;

    const confirmed = await dialog.warning({
        title: 'Delete Marker?',
        message: `Are you sure you want to delete the marker "${markerToDelete.context}" at ${formatTime(markerToDelete.timestamp)}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
    });

    if (confirmed) {
        const newMarkers = project.markers.filter(m => m.id !== markerId);
        handleUpdateMarkers(newMarkers);
    }
  };
  
  const addMarker = useCallback(() => {
    if (assetTypes.length === 0) {
      dialog.alert({
        title: 'Cannot Add Marker',
        message: 'Please add at least one Asset Type in the Settings page before creating a marker.'
      });
      return;
    }
    const newMarker: Marker = {
      id: `marker_${Date.now()}`,
      timestamp: currentTime,
      context: newMarkerContext.trim() || 'New marker...',
      type: newMarkerType,
      status: AssetStatus.ToDo,
    };
    const sortedMarkers = [...project.markers, newMarker].sort((a, b) => a.timestamp - b.timestamp);
    handleUpdateMarkers(sortedMarkers);
    
    setNewMarkerContext('');
    setNewMarkerType(assetTypes[0]?.name || '');
    setIsEditingMobileContext(false);
  }, [currentTime, project.markers, newMarkerContext, newMarkerType, handleUpdateMarkers, assetTypes, dialog]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        if (event.key.toLowerCase() === 'm' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
            event.preventDefault();
            addMarker();
        }
        if (event.key === 'Enter' && target.tagName === 'INPUT' && isEditingMobileContext) {
            setIsEditingMobileContext(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [addMarker, isEditingMobileContext]);

  const MobileWaveform = () => {
    const waveformRef = useRef<HTMLDivElement>(null);
    const bars = useMemo(() => Array.from({ length: 100 }, () => Math.random() * 0.9 + 0.1), []);

    const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!waveformRef.current || project.duration === 0) return;
        const rect = waveformRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        handleSeek(project.duration * percentage);
    };

    const progress = project.duration > 0 ? (currentTime / project.duration) * 100 : 0;

    return (
        <div ref={waveformRef} className="relative w-full h-[72px] bg-black rounded-xl cursor-pointer overflow-hidden" onClick={handleWaveformClick}>
            <div className="absolute top-2.5 left-0 right-0 h-3 flex items-center px-1">
                {project.markers.map(marker => (
                    <div key={marker.id} style={{ left: `${(marker.timestamp / project.duration) * 100}%` }}
                         className={`absolute w-5 h-5 ${typeColorMap[marker.type] || 'bg-gray-400'} rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow`}>
                        I
                    </div>
                ))}
            </div>

            <div className="absolute inset-0 flex items-end justify-between px-2 pb-2">
                {bars.map((height, i) => (
                    <div key={i} className="w-[2.5px] bg-white/20 rounded-full" style={{ height: `${height * 60}%` }} />
                ))}
            </div>
            <div className="absolute inset-0 flex items-end justify-between px-2 pb-2" style={{ clipPath: `polygon(0 0, ${progress}% 0, ${progress}% 100%, 0 100%)` }}>
                {bars.map((height, i) => (
                    <div key={i} className="w-[2.5px] bg-white rounded-full" style={{ height: `${height * 60}%` }} />
                ))}
            </div>
            <div className="absolute right-4 bottom-3 flex gap-0.5">
                {[...Array(3)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-white/50"></div>)}
            </div>
        </div>
    );
};


  return (
    <div className="w-full max-w-5xl h-full flex flex-col">
      <audio ref={audioRef} src={project.audioUrl} className="hidden" />
      
      {/* Desktop view */}
      <div className="hidden md:flex w-full h-full flex-col gap-6">
        <div className="w-full p-4 bg-black/5 rounded-2xl flex-shrink-0">
          <WaveformDisplay 
              duration={project.duration} 
              currentTime={currentTime} 
              markers={project.markers} 
              assetTypes={assetTypes}
              onSeek={handleSeek}
          />
          <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={togglePlayPause} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <div className="text-sm font-mono text-gray-700">
                  {formatTime(currentTime)} / {formatTime(project.duration)}
              </div>
          </div>
        </div>
        
        <div className="flex-grow flex flex-col gap-4 min-h-0">
           <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 p-2 bg-gray-100 rounded-lg">
              <input
                  type="text"
                  placeholder="Context... (optional)"
                  value={newMarkerContext}
                  onChange={(e) => setNewMarkerContext(e.target.value)}
                  className="w-full sm:flex-grow bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none"
              />
              <select
                  value={newMarkerType}
                  onChange={(e) => setNewMarkerType(e.target.value)}
                  className="w-full sm:w-auto bg-white border border-gray-200 rounded-md px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none"
                  disabled={assetTypes.length === 0}
              >
                  {assetTypes.map(type => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
              </select>
              <button 
                  onClick={addMarker}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  disabled={assetTypes.length === 0}
              >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add</span>
              </button>
          </div>
          <div className="relative flex-1">
            <div className="absolute inset-0">
              <MarkersTable 
                  markers={project.markers} 
                  assetTypes={assetTypes}
                  onUpdateMarkers={handleUpdateMarkers}
                  onTimestampClick={handleSeek}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile view */}
      <div className="md:hidden flex flex-col h-full bg-gray-50 overflow-hidden">
        <div className="flex-grow overflow-y-auto px-4 pt-2 pb-4 space-y-2">
          {project.markers.map(marker => (
            <div key={marker.id} className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
              <div className="w-16 text-center text-sm font-semibold text-rose-600 bg-rose-100 rounded-md p-2">
                {formatTime(marker.timestamp)}
              </div>
              <div className="flex-grow text-gray-800 text-sm truncate">{marker.context}</div>
              <div className="flex items-center gap-1">
                <div className="relative">
                  <select
                    value={marker.type}
                    onChange={(e) => handleMarkerChange(marker.id, 'type', e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    disabled={assetTypes.length === 0}
                  >
                    {assetTypes.map(type => (
                        <option key={type.id} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                  <div className={`flex items-center gap-1 p-2 ${typeColorMap[marker.type] || 'bg-gray-400'} text-white rounded-lg pointer-events-none`}>
                    <ImageIcon className="w-4 h-4" />
                    <ChevronDownIcon className="w-3 h-3" />
                  </div>
                </div>
                
                <div className="relative">
                  <select
                    value={marker.status}
                    onChange={(e) => handleMarkerChange(marker.id, 'status', e.target.value as AssetStatus)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  >
                    {Object.values(AssetStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className={`flex items-center gap-1 p-2 ${ASSET_STATUS_COLORS[marker.status]} text-white rounded-lg pointer-events-none`}>
                    <DoubleCheckIcon className="w-4 h-4" />
                    <ChevronDownIcon className="w-3 h-3" />
                  </div>
                </div>

                <button onClick={() => handleDeleteMarker(marker.id)} className="p-2 text-gray-400 hover:text-gray-500">
                  <DotsVerticalIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex-shrink-0 bg-white p-3 space-y-3 border-t border-gray-200">
          <div className="space-y-1">
            <MobileWaveform />
            <div className="flex items-center justify-center gap-4">
              <button onClick={togglePlayPause} className="p-2 text-gray-800">
                  {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
              </button>
              <div className="text-sm font-mono text-gray-700 w-28 text-center">
                  {formatMobilePlayerTime(currentTime)} / {formatTime(project.duration)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
                <select 
                    value={newMarkerType} 
                    onChange={e => setNewMarkerType(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                >
                    {assetTypes.map(type => (
                        <option key={type.id} value={type.name}>{type.name}</option>
                    ))}
                </select>
                <div className={`w-12 h-12 flex items-center justify-center ${typeColorMap[newMarkerType] || 'bg-gray-400'} text-white rounded-full pointer-events-none`}>
                    <ImageIcon className="w-5 h-5" />
                    <ChevronDownIcon className="w-4 h-4 -ml-1" />
                </div>
            </div>

            {isEditingMobileContext ? (
              <input
                type="text"
                placeholder="Context..."
                value={newMarkerContext}
                onChange={(e) => setNewMarkerContext(e.target.value)}
                onBlur={() => setIsEditingMobileContext(false)}
                autoFocus
                className="flex-grow bg-gray-100 rounded-full px-4 py-3 border border-gray-300 focus:outline-none "
              />
            ) : (
              <button 
                onClick={() => setIsEditingMobileContext(true)}
                className="flex-grow text-left px-4 py-3 bg-gray-100 text-gray-500 rounded-lg truncate"
              >
                {newMarkerContext || 'Context...'}
              </button>
            )}
            
            <button onClick={addMarker} className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-full">
              <BookmarkIcon className="w-5 h-5" />
              Mark
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioEditor;