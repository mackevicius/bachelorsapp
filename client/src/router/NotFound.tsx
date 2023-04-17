import styles from './NotFound.module.scss';

const NotFound = () => {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1>Oops! You seem to be lost.</h1>
      </header>
    </div>
  );
};

export default NotFound;
