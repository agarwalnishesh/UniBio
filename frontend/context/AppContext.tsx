import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ToolId, ToolData } from '../types';
import { TOOLS } from '../constants';

interface AppContextType {
  activeTool: ToolId;
  setActiveTool: (id: ToolId) => void;
  toolState: Record<ToolId, ToolData>;
  updateToolData: (id: ToolId, data: Partial<ToolData>) => void;
  isAgentProcessing: boolean;
  setIsAgentProcessing: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [activeTool, setActiveTool] = useState<ToolId>(ToolId.DASHBOARD);
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);
  
  // Initialize state for all tools with defaults
  const [toolState, setToolState] = useState<Record<ToolId, ToolData>>(() => {
    const initial: Record<string, ToolData> = {};
    Object.values(TOOLS).forEach(tool => {
      initial[tool.id] = tool.defaultData;
    });
    return initial as Record<ToolId, ToolData>;
  });

  const updateToolData = (id: ToolId, data: Partial<ToolData>) => {
    setToolState(prev => ({
      ...prev,
      [id]: { ...prev[id], ...data }
    }));
  };

  return (
    <AppContext.Provider 
      value={{ 
        activeTool, 
        setActiveTool, 
        toolState, 
        updateToolData,
        isAgentProcessing,
        setIsAgentProcessing
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
