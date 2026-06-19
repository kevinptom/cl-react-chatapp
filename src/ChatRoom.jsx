import { useState } from 'react';
import { db } from './firebase';
import { collection, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';

export default function ChatRoom({ roomName }) {
  const [formValue, setFormValue] = useState('');
  
  // Reference the specific room's collection
  const messagesRef = collection(db, `rooms/${roomName}/messages`);
  const q = query(messagesRef, orderBy('createdAt'));
  
  // Listen for real-time updates
  const [messages] = useCollectionData(q, { idField: 'id' });

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!formValue.trim()) return;

    await addDoc(messagesRef, {
      text: formValue,
      createdAt: serverTimestamp(),
      user: 'Anonymous' // You can add actual Authentication later!
    });

    setFormValue('');
  };

  return (
    <div className="chat-container">
      <h2>Room: {roomName}</h2>
      
      <div className="messages">
        {messages && messages.map((msg, index) => (
          <div key={index} className="message">
            <strong>{msg.user}: </strong> {msg.text}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage}>
        <input 
          value={formValue} 
          onChange={(e) => setFormValue(e.target.value)} 
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}