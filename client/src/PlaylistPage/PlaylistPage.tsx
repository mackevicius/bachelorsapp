import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './PlaylistPage.module.scss';
import { Context } from '../appContext';
import { Button } from '@mui/material';
import axios from 'axios';

interface Props {
  onMessageSend: (userId: string, trackId: string, vote: string) => void;
}

export const PlaylistPage: React.FC<Props> = ({ onMessageSend }) => {
  const [tracks, setTracks] = useState<any[]>([]);
  const { apiUrl } = useContext(Context);
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios
      .get(apiUrl + '/getPlaylistTracks?id=' + id, { withCredentials: true })
      .then((res) => {
        setTracks(res.data);
      })
      .catch((err) => {
        if (err.response.data === 'loggedOut') {
          localStorage.removeItem('loggedIn');
          navigate('/login');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className={styles.trackList}>
      {tracks &&
        tracks.map((track) => (
          <div className={styles.track} key={track.track?.id}>
            <div>
              <b>{track.track?.name} </b>
              {track.track?.artists.map(
                (artist: SpotifyApi.ArtistObjectFull) => (
                  <span key={artist.id}>{artist.name}</span>
                )
              )}
            </div>
            <div className={styles.votingSection}>
              <span>votes: {track.votes}</span>
              {/* <span>{(lastJsonMessage as any)?.data.points}</span> */}
              <Button
                size="small"
                type="submit"
                color="error"
                onClick={() => onMessageSend('lopas', 'duhas', 'daunas')}
              >
                5 points
              </Button>
            </div>
          </div>
        ))}
    </div>
  );
};
