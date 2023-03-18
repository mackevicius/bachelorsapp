import App from './App';
import Login from './Login';
import { Routes, Route, Navigate } from 'react-router-dom';

import { Context, defaultValue } from './appContext';
import { Home } from './Homepage/Home';

const App2 = () => {
  const code = new URLSearchParams(window.location.search).get('code');
  console.log('KODAS', code);
  return (
    <Context.Provider value={defaultValue}>
      <Routes>
        <Route
          path="/"
          element={code ? <Home code={code} /> : <Navigate to="/login" />}
        />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Context.Provider>
  );
};

export default App2;
