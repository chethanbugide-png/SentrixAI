import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NeuralBackground from './NeuralBackground';
import CommandPalette from './CommandPalette';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative antialiased">
      {/* Subtle ambient lighting */}
      <NeuralBackground />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out relative z-10 ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Header
          collapsed={collapsed}
          onOpenCommandPalette={() => setPaletteOpen(true)}
        />
        <main className="flex-1 mt-16 p-6 lg:p-8 w-full max-w-[1440px] mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
