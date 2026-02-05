import React from 'react';
import { useApp } from '../context/AppContext';
import { TOOLS } from '../constants';
import { ToolId } from '../types';

const Sidebar: React.FC = () => {
  const { activeTool, setActiveTool } = useApp();

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-300 flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold">
                U
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">UniBio</h1>
        </div>

        <nav className="space-y-1">
          {Object.values(TOOLS).map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-900/50 text-brand-100 border border-brand-800 shadow-sm' 
                    : 'hover:bg-slate-800 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-500' : 'text-slate-500'}`} />
                {tool.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700"></div>
          <div className="text-xs">
            <div className="font-medium text-white">Dr. Scientist</div>
            <div className="text-slate-500">Pro Plan</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
