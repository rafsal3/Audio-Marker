
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Project, Marker, AssetStatus, CustomAssetType } from '../types';
import { PlayIcon, PauseIcon, PlusIcon } from './icons';
import MarkersTable from './MarkersTable';
import { useDialog } from '../contexts/DialogProvider';

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

const WaveformDisplay: React.FC<{ 
  duration: number, 
  currentTime: number, 
  markers: Marker[], 
  assetTypes: CustomAssetType[],
  onSeek: (time: number) => void 
}> = ({ duration, currentTime, markers, assetTypes, onSeek }) => {
    const waveformRef = useRef<HTMLDivElement>(null);
    const bars = Array.from({ length: 200 }, () => Math.random() * 0.9 + 0.1);

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
  const dialog = useDialog();

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
  }, [currentTime, project.markers, newMarkerContext, newMarkerType, handleUpdateMarkers, assetTypes, dialog]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'm') {
        const target = event.target as HTMLElement;
        if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
            event.preventDefault();
            addMarker();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [addMarker]);


  return (
    <div className="w-full max-w-5xl h-full flex flex-col gap-6">
      <audio ref={audioRef} src={project.audioUrl} className="hidden" />
      
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
            <div className="flex items-center gap-2 self-end sm:self-auto">
                <button 
                    onClick={addMarker}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    disabled={assetTypes.length === 0}
                >
                    <PlusIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Marker</span>
                    <span className="sm:hidden">Add</span>
                </button>
                <span className="text-xs text-gray-500 font-mono pr-2 hidden sm:inline">or press M</span>
            </div>
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
  );
};

export default AudioEditor;
