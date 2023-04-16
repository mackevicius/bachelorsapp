import { Button } from '@mui/material';
import { forwardRef } from 'react';
import { Track, UserVote } from '../PlaylistPage';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import styles from './Track.module.scss';

interface Props {
  track: Track;
  userVotes: UserVote[];
  playlistId: string;
  currentPlace: number;
  isTrackVotedOn: (trackId: string) => boolean;
  onPlay: (trackUri: string) => void;
  onMessageSend: (playlistId: string, trackId: string, points: number) => void;
}
export const TrackTile: React.FC<Props> = forwardRef(
  (props: Props, ref: React.ForwardedRef<any>) => {
    const getUnvotePoints = (trackId: string): number => {
      const match = props.userVotes.find(
        (vote: any) => vote?.trackId === trackId
      );
      if (match) {
        return match.points * -1;
      } else return 0;
    };

    return (
      <div ref={ref} key={props.track.track?.id} className={styles.track}>
        <div className={styles.placeSection}>
          <span>{props.currentPlace + 1}</span>
        </div>
        <div className={styles.imageSection}>
          <button
            className={styles.trackPlay}
            onClick={() => props.onPlay(props.track.track?.uri as string)}
          >
            <PlayArrowIcon />
          </button>
          <img src={props.track.track?.album.images[0].url} alt="track image" />
        </div>
        <div className={styles.nameSection}>
          <b>{props.track.track?.name} </b>
          <span>
            {props.track.track?.artists.map(
              (artist: SpotifyApi.ArtistObjectSimplified, index) => {
                if (
                  index ===
                  (props.track.track?.artists.length as number) - 1
                ) {
                  return <span key={artist.id}>{artist.name}</span>;
                }
                return <span key={artist.id}>{artist.name}, </span>;
              }
            )}
          </span>
        </div>
        <div className={styles.votingSection}>
          <span>votes: {props.track.votes}</span>
          {/* <span>{(lastJsonMessage as any)?.data.points}</span> */}
          {props.isTrackVotedOn(props.track.track?.id || '') ? (
            <>
              <span style={{ marginLeft: 10 }}>
                You gave:{' '}
                {
                  props.userVotes.find(
                    (x) => x.trackId === props.track.track?.id
                  )?.points
                }{' '}
                points
              </span>
              <Button
                onClick={() =>
                  props.onMessageSend(
                    props.playlistId || '',
                    props.track?.track?.id || 's',
                    getUnvotePoints(props.track.track?.id as string)
                  )
                }
              >
                Unvote
              </Button>
            </>
          ) : (
            props.userVotes.map(
              (x) =>
                !x.trackId && (
                  <Button
                    key={x.points}
                    size="small"
                    type="submit"
                    color="success"
                    onClick={() =>
                      props.onMessageSend(
                        props.playlistId || '',
                        props.track?.track?.id || 's',
                        x.points
                      )
                    }
                  >
                    {x.points}
                  </Button>
                )
            )
          )}
        </div>
      </div>
    );
  }
);
TrackTile.displayName = 'TrackTile';
