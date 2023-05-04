import React, { useContext } from 'react';
import styles from '../Home.module.scss';
import { CardMedia } from '@mui/material';
import playButton from '../../assets/Spotify-Play-Button.png';
import { Playlist } from '../Home';
import { Context } from '../../context/appContext';
import axios from 'axios';

interface Props {
  playlist: Playlist;
  onPlaylistClick: () => void;
  onNoDevicesFound: () => void;
  onPlaySuccess: () => void;
}

export const PlaylistCard: React.FC<Props> = ({
  playlist,
  onPlaylistClick,
  onNoDevicesFound,
  onPlaySuccess,
}) => {
  const context = useContext(Context);

  const playPlaylist = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    axios
      .post(
        `${context.apiUrl}/playlistPreview`,
        {
          id: playlist.id,
        },
        { withCredentials: true }
      )
      .then(() => onPlaySuccess())
      .catch((err) => {
        if (err.response?.data === 'noDevices') {
          onNoDevicesFound();
        }
      });
  };
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
      <img
        src={playButton}
        className={styles.playButton}
        alt="PlayButton"
        onClick={(e) => playPlaylist(e)}
      />
    </div>
  );
};
