'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import CodeMentorTab from '@/components/CodeMentorTab';
import LectureConverterTab from '@/components/LectureConverterTab';

export default function Home() {
  const [activeTab, setActiveTab] = useState('mentor');

  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col">
        {activeTab === 'mentor' ? (
          <CodeMentorTab />
        ) : (
          <LectureConverterTab />
        )}
      </div>
    </main>
  );
}
