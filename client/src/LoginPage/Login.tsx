import { Button, Typography } from '@mui/material';
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Context } from '../appContext';
import styles from './Login.module.scss';
import spotifyIcon from '../assets/spotifyIcon.png';

const Login = () => {
  const context = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('userId');
    if (localStorage.getItem('loggedIn')) navigate('/');
  }, []);
  return (
    <div className={styles.loginPageContainer}>
      <header className={styles.infoSection}>
        <div>Collaborative Spotify playlist voting app</div>
        <div>Playlist tops decided by spotify users</div>
        <div>Vote for your favorite songs!</div>
      </header>

      <a className={styles.loginBtn} href={`${context.apiUrl}/login`}>
        <img width={35} height={35} src={spotifyIcon} alt="spotifyIcon" />
        Login with Spotify
      </a>
    </div>
  );
};

export default Login;
