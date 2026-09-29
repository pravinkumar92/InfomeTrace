import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

const Header = () => {
  const [statusCount, setStatusCount] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/status/audit');
        const data = await response.json();
        setStatusCount(data.count);
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-ink text-surface flex items-center justify-between px-8 shrink-0 relative z-20 border-b-4 border-accent">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
          <h1 className="text-lg font-bold tracking-[0.3em] text-surface">INFOMETRACE</h1>
        </div>
        <span className="text-accent h-6 border-l-2"></span>
        <p className="text-xs text-surface/70 font-mono tracking-wider uppercase">
          Food Safety Intelligence Platform
        </p>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Removed Active Incidents indicator */}
      </div>
    </header>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col text-ink font-sans bg-transparent">
      <Header />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-[95%] mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
};
