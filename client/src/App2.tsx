import App from './App';
import Login from './Login';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Context, defaultValue } from './appContext';
import { Home } from './Homepage/Home';
import { useContext, useEffect, useMemo, useState } from 'react';
import { PlaylistPage } from './PlaylistPage/PlaylistPage';
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket';

const App2 = () => {
  // const value = Object.assign({ ...defaultValue, code });
  // const accessToken = useAuth(code);
  const { apiUrl, socketUrl } = useContext(Context);

  const socket = useWebSocket(socketUrl, {
    onOpen: (event) => {
      console.log('WebSocket connection established.');
    },
    share: true,
    filter: () => false,
    retryOnError: true,
    shouldReconnect: () => true,
    onMessage(event) {
      console.log(JSON.parse(event?.data));
    },
  });

  const handleSendMessage = (userId: string, trackId: string, vote: string) => {
    socket.sendJsonMessage({
      type: 'contentchange',
      content: {
        userId: 'povilas',
        playlistId: 'adsas',
        trackId: 'asda',
        vote: '2',
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
          element={<PlaylistPage onMessageSend={handleSendMessage} />}
        />
      </Routes>
    </Context.Provider>
  );
};

export default App2;
