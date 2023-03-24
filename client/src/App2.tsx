import App from './App';
import Login from './Login';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Context, defaultValue } from './appContext';
import { Home } from './Homepage/Home';
import { useContext, useEffect, useMemo, useState } from 'react';
import { PlaylistPage } from './PlaylistPage/PlaylistPage';
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket';

function isDocumentEvent(message: any) {
  const evt = JSON.parse(message.data);
  return evt.type === 'contentchange' || evt.type === 'error';
}

export interface Vote {
  trackId: string;
  userId: string;
  points: number;
}
const App2 = () => {
  // const value = Object.assign({ ...defaultValue, code });
  // const accessToken = useAuth(code);
  const { apiUrl, socketUrl } = useContext(Context);

  console.log('NAUJAUSIAS');

  const socket = useWebSocket(socketUrl, {
    onOpen: (event) => {
      console.log('WebSocket connection established.');
    },
    share: true,
    filter: isDocumentEvent,
    retryOnError: true,
    shouldReconnect: () => true,
    onMessage(event) {
      // console.log(event);
    },
  });

  const handleSendMessage = (
    playlistId: string,
    trackId: string,
    points: string
  ) => {
    socket.sendJsonMessage({
      type: 'contentchange',
      content: {
        playlistId,
        trackId,
        points,
      },
    });
  };

  return (
    <Context.Provider value={defaultValue}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/playlist/:id"
          element={
            <PlaylistPage socket={socket} onMessageSend={handleSendMessage} />
          }
        />
      </Routes>
    </Context.Provider>
  );
};

export default App2;
