import Skeleton from '@mui/material/Skeleton';
import styles from '../Home.module.scss';

interface MediaProps {
  loading?: boolean;
}

export const PlaylistLoadingSkeleton = () => {
  return (
    <>
      {Array.from(new Array(20)).map((item, index) => (
        <div className={styles.playlistCard} key={index}>
          <Skeleton variant="rounded" width={'100%'} height={'100%'} />
        </div>
      ))}
    </>
  );
};
