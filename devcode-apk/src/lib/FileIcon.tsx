import React, { useMemo, useState } from 'react';
import iconMap from './icon-map.json';
import { File, Folder, FolderOpen } from 'lucide-react';

// High-performance maps for O(1) lookup
const fileNameMap = new Map<string, string>();
const fileExtensionMap = new Map<string, string>();
const folderNameMap = new Map<string, string>();

// Global Result Cache to achieve "Speed of Light" resolution after first hit
const resultCache = new Map<string, string>();

// Initialize maps once at module load
(function initializeMaps() {
  const { files, folders } = iconMap;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.file_name) {
      for (let j = 0; j < file.file_name.length; j++) {
        fileNameMap.set(file.file_name[j].toLowerCase(), file.name);
      }
    }
    if (file.file_extensions) {
      for (let j = 0; j < file.file_extensions.length; j++) {
        fileExtensionMap.set(file.file_extensions[j].toLowerCase(), file.name);
      }
    }
  }

  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    if (folder.folder_name) {
      for (let j = 0; j < folder.folder_name.length; j++) {
        folderNameMap.set(folder.folder_name[j].toLowerCase(), folder.name);
      }
    }
  }
})();

interface FileIconProps {
  name: string;
  isFolder?: boolean;
  isOpen?: boolean;
  className?: string;
}

export function getFileIconName(filename: string, isFolder: boolean = false, isOpen: boolean = false): string {
  // Generate a unique cache key
  const cacheKey = `${filename}|${isFolder}|${isOpen}`;
  const cached = resultCache.get(cacheKey);
  if (cached) return cached;

  let result = 'default';

  if (isFolder) {
    if (!filename) {
      result = isOpen ? 'folder-root-open' : 'folder-root';
    } else {
      const folderName = filename.toLowerCase();
      const folderIconName = folderNameMap.get(folderName);
      if (folderIconName) {
        result = isOpen ? `${folderIconName}-open` : folderIconName;
      } else {
        result = isOpen ? 'folder-open' : 'folder';
      }
    }
  } else {
    const lowerName = filename.toLowerCase();
    
    // 1. Exact match
    const exactMatch = fileNameMap.get(lowerName);
    if (exactMatch) {
      result = exactMatch;
    } else {
      // 2. Extension match (try longest first, e.g. .test.tsx -> test.tsx -> tsx)
      const names = filename.split('.');
      if (names.length > 1) {
        for (let i = 1; i < names.length; i++) {
          const currentExt = names.slice(i).join('.').toLowerCase();
          const extMatch = fileExtensionMap.get(currentExt);
          if (extMatch) {
            result = extMatch;
            break;
          }
        }
      }
    }
  }

  resultCache.set(cacheKey, result);
  return result;
}

export function FileIcon({ name, isFolder = false, isOpen = false, className = '' }: FileIconProps) {
  const iconName = useMemo(() => getFileIconName(name, isFolder, isOpen), [name, isFolder, isOpen]);
  const [errorLevel, setErrorLevel] = useState(0);
  
  // Use Vite's BASE_URL to correctly resolve icons regardless of deployment path
  const baseUrl = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL;
  const iconPath = `${baseUrl}/icons/`;
  
  if (errorLevel >= 2) {
     if (isFolder) {
       return isOpen ? <FolderOpen className={`w-5 h-5 ${className}`} /> : <Folder className={`w-5 h-5 ${className}`} />;
     }
     return <File className={`w-5 h-5 ${className}`} />;
  }
  
  const currentSrc = errorLevel === 0 
    ? `${iconPath}${iconName}.svg` 
    : `${iconPath}${isFolder ? (isOpen ? 'folder-open' : 'folder') : 'default'}.svg`;
  
  return (
    <div 
      className={`relative inline-block flex-shrink-0 ${className || 'w-5 h-5'}`}
    >
      <div
        className="w-full h-full bg-contain bg-center bg-no-repeat transition-opacity duration-200"
        style={{ 
          backgroundImage: `url("${currentSrc}")`,
          opacity: errorLevel < 2 ? 1 : 0
        }}
      />
      
      {/* Invisible image to detect loading errors */}
      <img
        src={currentSrc}
        className="hidden"
        referrerPolicy="no-referrer"
        onError={() => {
          setErrorLevel(prev => prev + 1);
        }}
        alt=""
      />

      {errorLevel >= 2 && (
        <div className="absolute inset-0 flex items-center justify-center">
          {isFolder ? (
            isOpen ? <FolderOpen className="w-5 h-5 text-blue-400" /> : <Folder className="w-5 h-5 text-blue-400" />
          ) : (
            <File className="w-5 h-5 text-gray-400" />
          )}
        </div>
      )}
    </div>
  );
}
