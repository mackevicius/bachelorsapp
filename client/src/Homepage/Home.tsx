import React, { useEffect, useState } from 'react';
import SpotifyWebApi from 'spotify-web-api-node';

import useAuth from '../useAuth';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import styles from './Home.module.scss';
import { PlaylistLoadingSkeleton } from '../common/PlaylistLoadingSkeleton';

interface Props {
  code: string;
}

const spotifyApi = new SpotifyWebApi({
  clientId: '2f260998e40849128281a3758eb04453',
});

export const Home: React.FC<Props> = ({ code }) => {
  const accessToken = useAuth(code);
  console.log(code);
  const [playlists, setPlaylists] = useState<any>();
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    if (accessToken) {
      spotifyApi.setAccessToken(accessToken);
      spotifyApi
        .getUserPlaylists('21y65ubkr6wutgxvdnj6f333a')
        .then((res) => {
          console.log(res.body.items);
          setPlaylists(res.body.items);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      console.log('nera');
    }
  }, [accessToken]);
  return (
    <div className={styles.cardContainer}>
      {loading ? (
        <PlaylistLoadingSkeleton />
      ) : (
        playlists?.map((x: SpotifyApi.PlaylistBaseObject) => (
          <Card
            key={x.id}
            style={{ width: 200, height: 150 }}
            className={styles.playlistCard}
          >
            <CardMedia
              image={x.images[0].url}
              sx={{ height: '70%' }}
              title={x.name}
            />
          </Card>
        ))
      )}
      {}
    </div>
  );
};
