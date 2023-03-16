const getRedirectUri = () => {
  console.log(process.env);
  if (process.env.NODE_ENV === 'development')
    return process.env.REACT_APP_REDIRECT_URI_DEV;
  return process.env.REACT_APP_REDIRECT_URI_PROD;
};

const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=2f260998e40849128281a3758eb04453&response_type=code&redirect_uri=${getRedirectUri()}&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state`;
const Login = () => {
  return (
    <div>
      <a href={AUTH_URL}>Login</a>
    </div>
  );
};

export default Login;
