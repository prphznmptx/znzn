import React from 'react';
import { User, Heart, Music, Film, Star } from 'lucide-react';

export default function Account() {
  const favoriteCreators = [
    { id: 1, name: 'Emma Wilson', avatar: 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png?auto=compress&cs=tinysrgb&w=150' },
    { id: 2, name: 'Ruby Nesda', avatar: 'https://images.pexels.com/photos/6311651/pexels-photo-6311651.jpeg?auto=compress&cs=tinysrgb&w=400' },
  ];

  const playlists = [
    { id: 1, name: 'Chill Vibes', content: [{ type: 'music', title: 'Sunset Groove' }, { type: 'music', title: 'Acoustic Soul' }] },
    { id: 2, name: 'Inspiration', content: [{ type: 'video', title: 'The Last Stand - Short Film' }, { type: 'blog', title: '10 Tips for a Killer Personal Brand' }] },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-playfair font-bold text-white mb-2">My Account</h1>
        <p className="text-gray-300 mb-8">Manage your preferences and curated content.</p>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Favorite Creators */}
            <div className="glass-effect p-6 rounded-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6">Favorite Creators</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {favoriteCreators.map(creator => (
                  <div key={creator.id} className="text-center">
                    <img src={creator.avatar} alt={creator.name} className="w-24 h-24 rounded-full mx-auto mb-2" />
                    <p className="text-white font-medium">{creator.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Playlists */}
            <div className="glass-effect p-6 rounded-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6">My Playlists</h2>
              <div className="space-y-4">
                {playlists.map(playlist => (
                  <div key={playlist.id} className="bg-white/5 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold text-white mb-2">{playlist.name}</h3>
                    <div className="space-y-2">
                      {playlist.content.map((item, index) => (
                        <div key={index} className="flex items-center space-x-3 text-gray-300">
                          {item.type === 'music' && <Music className="w-4 h-4 text-rose-400" />}
                          {item.type === 'video' && <Film className="w-4 h-4 text-blue-400" />}
                          {item.type === 'podcast' && <User className="w-4 h-4 text-green-400" />}
                          <span>{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Account Summary */}
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6">Account Summary</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
