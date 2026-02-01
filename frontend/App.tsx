import React from 'react';
import Sidebar from './components/Sidebar';
import AgentChat from './components/AgentChat';
import { AppProvider, useApp } from './context/AppContext';
import { ToolId } from './types';
import PrimerDesign from './components/tools/PrimerDesign';
import RestrictionAnalyzer from './components/tools/RestrictionAnalyzer';
import GibsonAssembly from './components/tools/GibsonAssembly';
import Dashboard from './components/tools/Dashboard';

// Wrapper component to handle routing based on state
const MainContent: React.FC = () => {
  const { activeTool } = useApp();

  const renderTool = () => {
    switch (activeTool) {
      case ToolId.PRIMER_DESIGN:
        return <PrimerDesign />;
      case ToolId.RESTRICTION_ANALYZER:
        return <RestrictionAnalyzer />;
      case ToolId.GIBSON_ASSEMBLY:
        return <GibsonAssembly />;
      case ToolId.DASHBOARD:
      default:
        return <Dashboard />;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
       {renderTool()}
    </main>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="flex h-screen w-screen bg-slate-50 font-sans overflow-hidden">
        <Sidebar />
        <MainContent />
        <AgentChat />
      </div>
    </AppProvider>
  );
};

export default App;
