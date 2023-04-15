import styles from './NotFound.module.scss';
import { Button } from '@mui/material';

const NotFound = () => {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1>Oops! You seem to be lost.</h1>
      </header>
      <Button variant="contained" color="primary">
        Go home
      </Button>
    </div>
  );
};

export default NotFound;
