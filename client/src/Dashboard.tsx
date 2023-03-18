import useAuth from './useAuth';
import SpotifyWebApi from 'spotify-web-api-node';
import { useEffect, useState } from 'react';

export default function Dashboard({ code }: { code: string }) {
  const accessToken = useAuth(code);
  const [bestArtist, setBestArtist] = useState('idk');

  const spotifyApi = new SpotifyWebApi({
    clientId: '2f260998e40849128281a3758eb04453',
  });

  useEffect(() => {
    console.log('pasikeite', accessToken);
    if (accessToken) {
      console.log('valio');
      spotifyApi.setAccessToken(accessToken);
      spotifyApi
        .getArtist('63UnvqBByUasqLkKkGGgmz')
        .then((res) => {
          setBestArtist(res.body.name);
        })
        .catch((err) => console.error);
    } else {
      return;
    }
  }, [accessToken]);

  return <div>{bestArtist}</div>;
}
