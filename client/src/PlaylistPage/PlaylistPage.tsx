import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './PlaylistPage.module.scss';
import { Context } from '../appContext';
import { Button } from '@mui/material';
import axios from 'axios';
import { JsonValue, WebSocketHook } from 'react-use-websocket/dist/lib/types';
import { Vote } from '../App2';

interface Props {
  socket: WebSocketHook<JsonValue | null, MessageEvent<any> | null>;
  onMessageSend: (playlistId: string, trackId: string, points: string) => void;
}

interface Tracks extends SpotifyApi.PlaylistTrackObject {
  votes: number;
}

export const PlaylistPage: React.FC<Props> = ({ socket, onMessageSend }) => {
  const [tracks, setTracks] = useState<Tracks[]>([]);

  const { apiUrl } = useContext(Context);
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [availableVotes, setAvailableVotes] = useState<string[] | null>(null);

  useEffect(() => {
    if ((socket.lastJsonMessage as any)?.type === 'error') {
      console.log(socket.lastJsonMessage as any);
      //notificationa
    } else {
      const vote = (socket.lastJsonMessage as any)?.data.editorContent as Vote;
      const theTrack = tracks.find((x) => x.track?.id === vote.trackId);
      const newTracks = tracks.map((x) => {
        if (x.track?.id === vote.trackId) {
          x.votes += Number(vote.points);
        }
        return x;
      });
      const newAvailableVotes = availableVotes?.filter(
        (x) => Number(x) !== Number(vote.points)
      );
      setTracks(newTracks);
      setAvailableVotes(newAvailableVotes || []);
    }
  }, [socket]);

  useEffect(() => {
    axios
      .get(apiUrl + '/getPlaylistTracks?id=' + id, { withCredentials: true })
      .then((res) => {
        setTracks(res.data);
        axios
          .get(apiUrl + '/getUserVotes?id=' + id, { withCredentials: true })
          .then((res) => {
            setAvailableVotes(res.data);
          })
          .catch((err) => {
            if (err.response.data === 'loggedOut') {
              localStorage.removeItem('loggedIn');
              navigate('/login');
            }
          })
          .finally(() => {});
      })
      .catch((err) => {
        console.error(err);
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
                (artist: SpotifyApi.ArtistObjectSimplified) => (
                  <span key={artist.id}>{artist.name}</span>
                )
              )}
            </div>
            <div className={styles.votingSection}>
              <span>votes: {(track as any).votes}</span>
              {/* <span>{(lastJsonMessage as any)?.data.points}</span> */}
              {availableVotes &&
                availableVotes.map((x) => (
                  <Button
                    key={x}
                    size="small"
                    type="submit"
                    color="error"
                    onClick={() =>
                      onMessageSend(id || '', track?.track?.id || 's', x)
                    }
                  >
                    {x}
                  </Button>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
};
