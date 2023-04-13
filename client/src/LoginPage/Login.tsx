import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Context } from '../appContext';
import styles from './Login.module.scss';
import spotifyIcon from '../assets/spotifyIcon2.png';

const Login = () => {
  const context = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('userId');
    if (localStorage.getItem('loggedIn')) navigate('/');
  }, []);
  return (
    <div className={styles.loginPageContainer}>
      <header className={styles.headerSection}>
        <h1>Collaborative Spotify playlist voting app</h1>
      </header>
      <div className={styles.lowerInfoSection}>
        <h3>Playlist tops decided by Spotify users</h3>
        <h3>Vote for your favorite songs!</h3>
      </div>

      <a className={styles.loginBtn} href={`${context.apiUrl}/login`}>
        <img width={25} height={25} src={spotifyIcon} alt="spotifyIcon" />
        <span>Login with Spotify</span>
      </a>
    </div>
  );
};

export default Login;
