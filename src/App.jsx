import { useState } from 'react';
import ChatRoom from './ChatRoom';
import './App.css';

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);

  const rooms = ['General', 'React-Help', 'Random'];

  return (
    <div className="App">
      <header>
        <h1>💬 Multi-Room Chat</h1>
      </header>

      {!currentRoom ? (
        <div className="room-selector">
          <h2>Select a Chat Room</h2>
          <div className="button-container">
            {rooms.map(room => (
              <button key={room} onClick={() => setCurrentRoom(room)}>
                Join {room}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <button className="leave-button" onClick={() => setCurrentRoom(null)}>
            Leave Room
          </button>
          <ChatRoom roomName={currentRoom} />
        </div>
      )}
    </div>
  );
}

export default App;