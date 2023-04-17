import LogoutIcon from '@mui/icons-material/Logout';
import styles from './LogOut.module.scss';
import { BootstrapTooltip } from './BootstrapTooltip';
import { useNavigate } from 'react-router-dom';

export const LogOutBar = () => {
  const navigate = useNavigate();
  const handleOnClick = () => {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userId');
    navigate('/login');
  };
  return (
    <BootstrapTooltip
      title={<h5 style={{ margin: 5, color: 'white' }}>Log out</h5>}
      placement="left"
    >
      <button className={styles.logOut} onClick={handleOnClick}>
        <LogoutIcon color="error" />
      </button>
    </BootstrapTooltip>
  );
};
