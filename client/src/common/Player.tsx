import React, { useEffect, useState } from 'react';
import SpotifyPlayer from 'react-spotify-web-playback';
import styles from './Player.module.scss';

interface Props {
  token: string;
  trackUri: string | undefined;
  tracksUris: string[];
}

export const Player: React.FC<Props> = ({ token, trackUri, tracksUris }) => {
  const [play, setPlay] = useState<boolean>(false);

  useEffect(() => {
    trackUri && setPlay(true);
  }, [trackUri]);

  return (
    <div className={styles.player}>
      <SpotifyPlayer
        token={token}
        uris={trackUri || tracksUris}
        name="player"
        play={play}
        callback={(state) => {
          if (state.isPlaying) setPlay(false);
        }}
        styles={{
          bgColor: 'black',
          color: 'white',
          altColor: 'white',
          sliderColor: '#1db954',
          sliderTrackColor: '#727272',
          sliderHandleColor: 'white',
          trackNameColor: 'white',
          loaderColor: 'white',
          height: 100,
        }}
      />
    </div>
  );
};
