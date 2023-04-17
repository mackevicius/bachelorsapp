import styles from '../PlaylistPage.module.scss';
import { CircularProgress } from '@mui/material';

export const PlaylistPageLoading = () => {
  return (
    <div className={styles.playlistLoading}>
      <CircularProgress color="success" size={120} />
    </div>
  );
};
