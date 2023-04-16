import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './PlaylistPage.module.scss';
import { Context } from '../context/appContext';
import axios from 'axios';
import { JsonValue, WebSocketHook } from 'react-use-websocket/dist/lib/types';
import { Vote } from '../App';
import FlipMove from 'react-flip-move';
import { TrackTile } from './components/Track';
import { Player } from '../common/Player';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { Tooltip, TooltipProps, styled, tooltipClasses } from '@mui/material';
import Zoom from '@mui/material/Zoom';

interface Props {
  socket: WebSocketHook<JsonValue | null, MessageEvent<any> | null>;
  onMessageSend: (playlistId: string, trackId: string, points: number) => void;
}

export interface Track extends SpotifyApi.PlaylistTrackObject {
  votes: number;
  place: number;
}

export interface UserVote {
  trackId: string | null;
  points: number;
}

export const PlaylistPage: React.FC<Props> = ({ socket, onMessageSend }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const { apiUrl } = useContext(Context);
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [playlistInfo, setPlaylistInfo] = useState<
    SpotifyApi.PlaylistBaseObject | undefined
  >(undefined);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [trackUri, setTrackUri] = useState<string | undefined>(undefined);
  const [playerTracks, setPlayerTracks] = useState<string[]>([]);

  useEffect(() => {
    if ((socket.lastJsonMessage as any)?.type === 'error') {
      console.log(socket.lastJsonMessage as any);
      //notificationa
    } else {
      const vote = (socket.lastJsonMessage as any)?.data.editorContent as Vote;
      if (vote?.points >= 0) {
        const newTracks = tracks.map((x) => {
          if (x.track?.id === vote.trackId) {
            x.votes += vote.points;
          }
          return x;
        });
        newTracks.sort((a, b) => b.votes - a.votes || a.place - b.place);
        const newUserVotes = userVotes.map((x) => {
          if (
            x.points === vote.points &&
            vote.userId === localStorage.getItem('userId')
          ) {
            return {
              trackId: vote.trackId,
              points: vote.points,
            };
          }
          return x;
        });
        setUserVotes(newUserVotes);
        setTracks(newTracks);
      } else {
        const match = userVotes.find((x) => x.trackId === vote.trackId) as Vote;
        const newTracks = tracks.map((x) => {
          if (x.track?.id === vote.trackId) {
            match ? (x.votes -= match.points) : (x.votes += vote.points);
          }
          return x;
        });
        newTracks.sort((a, b) => b.votes - a.votes || a.place - b.place);
        const newUserVotes = userVotes.map((x) => {
          if (
            x.trackId === vote.trackId &&
            vote.userId === localStorage.getItem('userId')
          ) {
            return {
              trackId: null,
              points: x.points,
            };
          }
          return x;
        });
        setUserVotes(newUserVotes);
        setTracks(newTracks);
      }
    }
  }, [socket]);

  useEffect(() => {
    axios.get(apiUrl + '/getToken', { withCredentials: true }).then((res) => {
      setToken(res.data);
    });
    axios
      .get(apiUrl + '/getPlaylistInfo?id=' + id, { withCredentials: true })
      .then((res) => {
        setPlaylistInfo(res.data.body);
      });

    axios
      .get(apiUrl + '/getPlaylistTracks?id=' + id, { withCredentials: true })
      .then((res) => {
        res.data.sort(
          (a: Track, b: Track) => b.votes - a.votes || a.place - b.place
        );
        const pTracks = res.data.map(
          (track: SpotifyApi.PlaylistTrackObject) => track.track?.uri
        );
        setPlayerTracks(pTracks);
        setTracks(res.data);
        axios
          .get(apiUrl + '/getUserVotes?id=' + id, { withCredentials: true })
          .then((res) => {
            setUserVotes(res.data);
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

  const BootstrapTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
      color: theme.palette.common.black,
    },
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.black,
    },
  }));

  const isTrackVotedOn = (trackId: string) =>
    !!userVotes.find((x) => x.trackId === trackId);

  return (
    <div className={styles.playlistPageContainer}>
      {isLoading ? (
        <div>liol</div>
      ) : (
        <>
          <header className={styles.playlistHeader}>
            <div className={styles.headerText}>
              <h1>{playlistInfo?.name}</h1>
              <h5>{playlistInfo?.description}</h5>
            </div>

            <div className={styles.coverImage}>
              <img src={playlistInfo?.images[0].url} alt={'playlistImage'} />

              <button className={styles.addPlaylistButton}>
                <BootstrapTooltip
                  title={
                    <h5 style={{ margin: 5, color: '#727272' }}>
                      Save playlist
                    </h5>
                  }
                  placement="left"
                  TransitionComponent={Zoom}
                  sx={{ fontSize: 20 }}
                >
                  <PlaylistAddIcon />
                </BootstrapTooltip>
              </button>
            </div>
          </header>
          <div className={styles.trackList}>
            {tracks.length && (
              <FlipMove>
                {tracks.map((x, index) => (
                  <TrackTile
                    key={x.track?.id}
                    track={x}
                    currentPlace={index}
                    playlistId={id || ''}
                    userVotes={userVotes}
                    onPlay={setTrackUri}
                    isTrackVotedOn={isTrackVotedOn}
                    onMessageSend={onMessageSend}
                  />
                ))}
              </FlipMove>
            )}
          </div>
          {token && (
            <Player
              token={token}
              trackUri={trackUri}
              tracksUris={playerTracks}
            />
          )}
        </>
      )}
    </div>
  );
};
