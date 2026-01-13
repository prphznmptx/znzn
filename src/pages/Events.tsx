import React, { useState } from 'react';
import { Users, Briefcase, Video, Image as ImageIcon } from 'lucide-react';
import JoinTab from '../components/JoinTab';
import LivestreamTab from '../components/LivestreamTab';
import OrganizeTab from '../components/OrganizeTab';
import MemoriesTab from '../components/MemoriesTab';

export default function Events() {
  const [activeTab, setActiveTab] = useState<'join' | 'livestream' | 'organize' | 'memories'>('join');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const tabs = [
    { id: 'join' as const, label: 'Join', icon: <Users className="w-4 h-4" /> },
    { id: 'livestream' as const, label: 'Livestream', icon: <Video className="w-4 h-4" /> },
    { id: 'organize' as const, label: 'Organize', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'memories' as const, label: 'Memories', icon: <ImageIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-playfair font-bold text-white mb-2">Events</h1>
            <p className="text-gray-300">
              Don't miss early bird tickets. Share with friends for more vibes and get rewards.
            </p>
          </div>
        </div>

        <div className="flex space-x-1 mb-8 glass-effect p-2 rounded-xl overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'join' && (
          <JoinTab
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
          />
        )}

        {activeTab === 'livestream' && (
          <LivestreamTab
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
          />
        )}

        {activeTab === 'organize' && <OrganizeTab />}

        {activeTab === 'memories' && <MemoriesTab />}
      </div>
    </div>
  );
}
