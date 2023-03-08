import App from './App';
import Login from './Login';

const App2 = () => {
  const code = new URLSearchParams(window.location.search).get('code');
  return code ? <App code={code} /> : <Login />;
};

export default App2;
