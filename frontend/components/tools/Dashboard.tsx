import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ToolId } from '../../types';
import { TOOLS } from '../../constants';
import { api } from '../../services/api';
import { CheckCircleIcon, XCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { setActiveTool } = useApp();
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkServer();
  }, []);

  const checkServer = async () => {
    setServerStatus('checking');
    try {
      await api.healthCheck();
      setServerStatus('online');
    } catch {
      setServerStatus('offline');
    }
  };

  const tools = Object.values(TOOLS).filter(t => t.id !== ToolId.DASHBOARD);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="inline-block p-4 rounded-full bg-brand-50 mb-6">
          <svg className="w-12 h-12 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Welcome to UniBio</h2>
        <p className="text-lg text-slate-500 max-w-lg mx-auto mb-6">
          Your intelligent workbench for molecular biology. Design primers, find restriction sites, 
          and plan cloning experiments with AI assistance.
        </p>

        {/* Server Status */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-sm">
          {serverStatus === 'checking' && (
            <>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
              <span className="text-slate-600">Checking server...</span>
            </>
          )}
          {serverStatus === 'online' && (
            <>
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <span className="text-green-700">Backend connected</span>
            </>
          )}
          {serverStatus === 'offline' && (
            <>
              <XCircleIcon className="w-5 h-5 text-red-500" />
              <span className="text-red-700">Backend offline</span>
              <button 
                onClick={checkServer}
                className="text-brand-600 hover:underline ml-2"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="group p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-brand-400 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <ArrowRightIcon className="w-5 h-5 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">{tool.name}</h3>
              <p className="text-sm text-slate-500">{tool.description}</p>
            </button>
          );
        })}
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white">
        <h3 className="text-xl font-semibold mb-4">Quick Start Guide</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-brand-400 mb-2">Using the Tools</h4>
            <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
              <li>Select a tool from the sidebar</li>
              <li>Enter your DNA sequence</li>
              <li>Adjust parameters as needed</li>
              <li>Click the action button to run analysis</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium text-brand-400 mb-2">Using the AI Assistant</h4>
            <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
              <li>Use the chat panel on the right</li>
              <li>Describe what you want to do</li>
              <li>The AI will use backend tools automatically</li>
              <li>Review results and ask follow-up questions</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Offline Warning */}
      {serverStatus === 'offline' && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Backend Server Not Running</h4>
          <p className="text-sm text-red-700 mb-3">
            The UniBio backend server is not responding. Please start it to use the tools.
          </p>
          <div className="bg-red-100 rounded p-3 font-mono text-sm text-red-800">
            cd UniBio<br/>
            python main.py
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
