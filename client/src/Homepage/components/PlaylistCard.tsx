import React from 'react';
import styles from '../Home.module.scss';
import { CardMedia } from '@mui/material';
import playButton from '../../assets/Spotify-Play-Button.png';
import { Playlist } from '../Home';

interface Props {
  playlist: Playlist;
  onPlaylistClick: () => void;
}

export const PlaylistCard: React.FC<Props> = ({
  playlist,
  onPlaylistClick,
}) => {
  return (
    <div className={styles.playlistCard} onClick={onPlaylistClick}>
      <CardMedia
        image={playlist.imageUrl}
        title={playlist.name}
        className={styles.cardImage}
      />
      <div className={styles.cardContent}>
        <span className={styles.title}>{playlist.name}</span>
        <span className={styles.description}>{playlist.description}</span>
      </div>
      <img src={playButton} className={styles.playButton} alt="PlayButton" />
    </div>
  );
};
