import { useState, useEffect, useRef } from 'react';
import { db, dataConverter } from './firebase';
import { collection, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { getStringColor } from './App';

export default function ChatRoom({ roomName, user }) {
  const [formValue, setFormValue] = useState('');
  const messagesEndRef = useRef(null);
  
  const userName = user ? (user.displayName || user.email?.split('@')[0] || 'Anonymous') : 'Anonymous';

  // Reference the specific room's messages collection
  const messagesRef = collection(db, `rooms/${roomName}/messages`).withConverter(dataConverter);
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  
  // Listen for real-time updates
  const [messages, loading, error] = useCollectionData(q);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!formValue.trim()) return;

    await addDoc(messagesRef, {
      text: formValue.trim(),
      createdAt: serverTimestamp(),
      user: userName,
      uid: user?.uid || 'anonymous',
      avatar: user?.photoURL || null
    });

    setFormValue('');
  };

  const formatTime = (createdAt) => {
    if (!createdAt) return 'Just now';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {loading && (
          <div className="chat-loading">
            <div className="spinner"></div>
            <p>Syncing transmission...</p>
          </div>
        )}
        
        {error && (
          <div className="empty-state">
            <span className="empty-state-emoji">⚠️</span>
            <h3>Failed to load messages</h3>
            <p>{error.message}</p>
          </div>
        )}

        {!loading && messages && messages.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-emoji">🚀</span>
            <h3>Welcome to the room!</h3>
            <p>Start the conversation by typing a message below.</p>
          </div>
        )}

        {!loading && messages && messages.map((msg) => {
          const isSelf = msg.uid ? (msg.uid === user?.uid) : (msg.user === userName);
          const userColor = getStringColor(msg.user || 'Anonymous');
          const firstLetter = (msg.user || 'A').charAt(0).toUpperCase();

          return (
            <div key={msg.id} className={`message ${isSelf ? 'self' : 'other'}`}>
              {!isSelf && (
                <div 
                  className="message-avatar" 
                  style={{ backgroundColor: userColor }}
                  title={msg.user}
                >
                  {msg.avatar ? (
                    <img src={msg.avatar} alt={msg.user} className="avatar-img" />
                  ) : (
                    firstLetter
                  )}
                </div>
              )}
              <div className="message-content-wrapper">
                {!isSelf && <span className="message-sender">{msg.user}</span>}
                <div className="message-bubble">
                  {msg.text}
                </div>
                <span className="message-time">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-form" onSubmit={sendMessage}>
        <input 
          value={formValue} 
          onChange={(e) => setFormValue(e.target.value)} 
          placeholder="Type a message..."
          maxLength={500}
          required
        />
        <button type="submit" className="btn btn-primary">
          Send
        </button>
      </form>
    </div>
  );
}