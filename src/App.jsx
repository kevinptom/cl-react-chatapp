import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import ChatRoom from './ChatRoom';
import './App.css';

const ADJECTIVES = ['Swift', 'Neon', 'Misty', 'Hyper', 'Golden', 'Cosmic', 'Pixel', 'Quantum', 'Sneaky', 'Epic', 'Astral', 'Solar'];
const NOUNS = ['Otter', 'Coder', 'Panda', 'Wizard', 'Ninja', 'Fox', 'Corgi', 'Falcon', 'Cheetah', 'Koala', 'Phoenix', 'Badger'];
const EMOJIS = ['💬', '⚛️', '🎮', '🚀', '🎨', '📚', '🍕', '🐱', '🎵', '💡', '🤖', '🌍'];
const CATEGORIES = ['All', 'Tech', 'Social', 'Gaming', 'Other'];

const generateRandomNickname = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}${noun}${num}`;
};

// Simple hash function to generate a consistent color based on string
export const getStringColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#ec4899', '#f43f5e', '#3b82f6', '#10b981', '#f59e0b',
    '#8b5cf6', '#06b6d4', '#14b8a6', '#6366f1', '#a855f7'
  ];
  return colors[Math.abs(hash) % colors.length];
};

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Nickname State
  const [nickname, setNickname] = useState(() => {
    const stored = localStorage.getItem('chat_nickname');
    if (stored) return stored;
    const gen = generateRandomNickname();
    localStorage.setItem('chat_nickname', gen);
    return gen;
  });

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tempNickname, setTempNickname] = useState(nickname);

  // Form States for New Room
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('Social');
  const [newRoomEmoji, setNewRoomEmoji] = useState('💬');

  // Firestore Rooms Collection
  const roomsRef = collection(db, 'rooms');
  const roomsQuery = query(roomsRef, orderBy('createdAt', 'desc'));
  const [rooms, loading, error] = useCollectionData(roomsQuery, { idField: 'id' });

  // Auto-seed default rooms if empty
  useEffect(() => {
    if (!loading && rooms && rooms.length === 0) {
      const seedRooms = async () => {
        const defaults = [
          { name: 'General', description: 'The main chat lobby for everyone.', category: 'Social', emoji: '💬', createdAt: new Date() },
          { name: 'React-Help', description: 'Ask questions and discuss React, Firestore, and Vite.', category: 'Tech', emoji: '⚛️', createdAt: new Date() },
          { name: 'Random', description: 'Memes, music, off-topic chat, and anything else.', category: 'Gaming', emoji: '🎮', createdAt: new Date() }
        ];
        for (const r of defaults) {
          await addDoc(roomsRef, {
            ...r,
            createdAt: serverTimestamp()
          });
        }
      };
      seedRooms();
    }
  }, [rooms, loading]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    await addDoc(roomsRef, {
      name: newRoomName.trim(),
      description: newRoomDesc.trim() || 'Welcome to the room!',
      category: newRoomCategory,
      emoji: newRoomEmoji,
      createdAt: serverTimestamp(),
      createdBy: nickname
    });

    // Reset Form
    setNewRoomName('');
    setNewRoomDesc('');
    setNewRoomCategory('Social');
    setNewRoomEmoji('💬');
    setIsCreateOpen(false);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (tempNickname.trim()) {
      setNickname(tempNickname.trim());
      localStorage.setItem('chat_nickname', tempNickname.trim());
      setIsProfileOpen(false);
    }
  };

  // Filter Rooms
  const filteredRooms = rooms ? rooms.filter(room => {
    const matchesSearch = room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          room.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || room.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) : [];

  const userColor = getStringColor(nickname);

  return (
    <div className="App">
      <header>
        <div className="logo-section">
          <h1><span>💬</span> SpaceChat</h1>
        </div>
        <div 
          className="user-profile-badge" 
          onClick={() => {
            setTempNickname(nickname);
            setIsProfileOpen(true);
          }}
        >
          <div className="avatar-dot" style={{ backgroundColor: userColor }}>
            {nickname.charAt(0).toUpperCase()}
          </div>
          <span className="username-display">{nickname}</span>
        </div>
      </header>

      {!currentRoom ? (
        <div className="lobby-container">
          <div className="lobby-controls">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search rooms..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="category-tabs">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat} 
                  className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              <span>+</span> Create Room
            </button>
          </div>

          {loading ? (
            <div className="chat-loading">
              <div className="spinner"></div>
              <p>Loading channels...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <span className="empty-state-emoji">⚠️</span>
              <h3>Error loading rooms</h3>
              <p>{error.message}</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-emoji">🛰️</span>
              <h3>No rooms found</h3>
              <p>Try searching for something else or create a new room!</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {filteredRooms.map(room => (
                <div 
                  key={room.id} 
                  className="room-card"
                  onClick={() => setCurrentRoom(room)}
                >
                  <div>
                    <div className="room-header">
                      <span className="room-emoji">{room.emoji || '💬'}</span>
                      <h3 className="room-title">{room.name}</h3>
                    </div>
                    <p className="room-desc">{room.description}</p>
                  </div>
                  <div className="room-footer">
                    <span className="room-tag">{room.category || 'Other'}</span>
                    <button className="room-join-btn">
                      Join Room ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="chat-layout">
          <aside className="chat-sidebar">
            <div className="chat-room-info">
              <div className="room-emoji">{currentRoom.emoji || '💬'}</div>
              <h2>{currentRoom.name}</h2>
              <p>{currentRoom.description}</p>
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span className="room-tag" style={{ alignSelf: 'flex-start' }}>{currentRoom.category || 'Other'}</span>
                {currentRoom.createdBy && (
                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Created by {currentRoom.createdBy}</span>
                )}
              </div>
            </div>
          </aside>

          <main className="chat-area">
            <div className="chat-header">
              <h3>
                <span>{currentRoom.emoji || '💬'}</span> 
                {currentRoom.name}
              </h3>
              <button className="btn btn-danger" onClick={() => setCurrentRoom(null)}>
                Leave Room
              </button>
            </div>
            <ChatRoom roomName={currentRoom.id} userName={nickname} />
          </main>
        </div>
      )}

      {/* Profile Settings Modal */}
      {isProfileOpen && (
        <div className="modal-backdrop" onClick={() => setIsProfileOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Customize Identity</h2>
              <button className="close-btn" onClick={() => setIsProfileOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label htmlFor="nickname">Your Nickname</label>
                <input 
                  id="nickname"
                  type="text" 
                  value={tempNickname} 
                  onChange={(e) => setTempNickname(e.target.value)}
                  placeholder="Enter custom nickname..."
                  maxLength={25}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsProfileOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Room</h2>
              <button className="close-btn" onClick={() => setIsCreateOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label htmlFor="roomName">Room Name</label>
                <input 
                  id="roomName"
                  type="text" 
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g., Space Explorers"
                  maxLength={20}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="roomDesc">Description</label>
                <textarea 
                  id="roomDesc"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="What is this chat room about?"
                  maxLength={100}
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label htmlFor="roomCat">Category</label>
                <select 
                  id="roomCat"
                  value={newRoomCategory}
                  onChange={(e) => setNewRoomCategory(e.target.value)}
                >
                  <option value="Social">Social</option>
                  <option value="Tech">Tech</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Room Icon</label>
                <div className="emoji-grid">
                  {EMOJIS.map(em => (
                    <div 
                      key={em}
                      className={`emoji-item ${newRoomEmoji === em ? 'selected' : ''}`}
                      onClick={() => setNewRoomEmoji(em)}
                    >
                      {em}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;