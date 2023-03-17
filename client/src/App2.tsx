import App from './App';
import Login from './Login';

import { Context, defaultValue } from './appContext';

const App2 = () => {
  const code = new URLSearchParams(window.location.search).get('code');
  return (
    <Context.Provider value={defaultValue}>
      {code ? <App code={code} /> : <Login />}
    </Context.Provider>
  );
};

export default App2;
