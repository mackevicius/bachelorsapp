import React, { useContext, useEffect, useState } from 'react';
import SpotifyWebApi from 'spotify-web-api-node';

import useAuth from '../useAuth';
import Card from '@mui/material/Card';
import { useNavigate } from 'react-router-dom';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import styles from './Home.module.scss';
import { PlaylistLoadingSkeleton } from '../common/PlaylistLoadingSkeleton';
import { Context } from '../appContext';
import axios from 'axios';

const spotifyApi = new SpotifyWebApi({
  clientId: '2f260998e40849128281a3758eb04453',
});

export const Home = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<any>();
  const [loading, setLoading] = useState<boolean>(true);
  const context = useContext(Context);

  useEffect(() => {
    localStorage.setItem('loggedIn', 'yes');
    axios
      .get(context.apiUrl + '/getPlaylists', { withCredentials: true })
      .then((res) => {
        setPlaylists(res.data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.response.data === 'loggedOut') {
          localStorage.removeItem('loggedIn');
          navigate('/login');
        }
        setLoading(false);
      });
  }, []);

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
            onClick={() => {
              navigate(`/playlist/${x.id}`);
            }}
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
