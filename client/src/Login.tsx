import { useContext } from 'react';
import { Context } from './appContext';

const Login = () => {
  const context = useContext(Context);

  const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=2f260998e40849128281a3758eb04453&response_type=code&redirect_uri=${context.redirectUri}&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state`;

  return (
    <div>
      <a href={AUTH_URL}>Login</a>
    </div>
  );
};

export default Login;
