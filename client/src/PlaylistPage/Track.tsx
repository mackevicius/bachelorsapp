import { Button } from '@mui/material';
import { forwardRef } from 'react';
import { Track, UserVote } from './PlaylistPage';

import styles from './PlaylistPage.module.scss';

interface Props {
  track: Track;
  userVotes: UserVote[];
  playlistId: string;
  isTrackVotedOn: (trackId: string) => boolean;
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
        <div>
          <b>{props.track.track?.name} </b>
          {props.track.track?.artists.map(
            (artist: SpotifyApi.ArtistObjectSimplified) => (
              <span key={artist.id}>{artist.name}</span>
            )
          )}
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
                    color="error"
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
