import { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.scss';
import { PlaylistLoadingSkeleton } from './components/PlaylistLoadingSkeleton';
import { Context } from '../context/appContext';
import axios from 'axios';
import ReactPaginate from 'react-paginate';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PlaylistCard } from './components/PlaylistCard';
import SearchBox from './components/SearchBox';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const COUNT = 20;

export interface Playlist {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export const Home = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<any>();
  const [loading, setLoading] = useState<boolean>(true);
  const context = useContext(Context);
  const divRef = useRef<HTMLDivElement>(null);
  const [itemOffset, setItemOffset] = useState(0);

  // Simulate fetching items from another resources.
  // (This could be items from props; or items loaded in a local state
  // from an API endpoint with useEffect and useState)
  const endOffset = itemOffset + COUNT;
  const currentItems = playlists?.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(playlists?.length / COUNT);

  const getPlaylists = () => {
    axios
      .get(context.apiUrl + '/getPlaylists', { withCredentials: true })
      .then((res) => {
        setPlaylists(res.data);
        setLoading(false);
        localStorage.setItem('loggedIn', 'yes');
      })
      .catch((err) => {
        if (err.response.data === 'loggedOut') {
          localStorage.removeItem('loggedIn');
          navigate('/login');
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    getPlaylists();
  }, []);

  const handleAddPlaylist = (
    playlistId: string,
    name: string,
    description: string,
    imageUrl: string
  ) => {
    setLoading(true);
    axios
      .post(
        context.apiUrl + '/addPlaylist',
        { playlistId, name, description, imageUrl },
        { withCredentials: true }
      )
      .then(() => {
        getPlaylists();
        toast('Playlist successfully added', {
          type: 'success',
          position: 'top-right',
          theme: 'colored',
        });
      })
      .catch((err) => {
        if (err.response.data === 'alreadyExists') {
          toast('Playlist already exists', {
            type: 'error',
            position: 'top-right',
            theme: 'colored',
          });
        }
        if (err.response.data === 'loggedOut') {
          localStorage.removeItem('loggedIn');
          navigate('/login');
        }
      })
      .finally(() => setLoading(false));
  };

  const handlePageClick = (event: any) => {
    const newOffset = (event.selected * COUNT) % playlists.length;
    console.log(
      `User requested page number ${event.selected}, which is offset ${newOffset}`
    );
    setItemOffset(newOffset);
  };

  const handleNoDevicesFound = () => {
    toast(
      'No active devices found. Make sure to open the Spotify App in your preferred device',
      {
        position: 'top-right',
        theme: 'colored',
        type: 'error',
      }
    );
  };

  const handlePlaySuccess = () => {
    toast(
      'The Playlist songs started playing on your Spotify app. Open the app to check out the playlist!',
      {
        type: 'success',
        position: 'top-right',
        theme: 'colored',
      }
    );
  };

  return (
    <div className={styles.homePageContainer}>
      <header>
        <SearchBox
          isPlaylistsLoading={loading}
          onAddPlaylist={handleAddPlaylist}
        />
      </header>
      <main>
        <h1 style={{ textAlign: 'left', margin: '10px 0 20px 10px' }}>
          Available Playlist Voting Sessions
        </h1>
        <div className={styles.cardContainer} ref={divRef}>
          {loading ? (
            <PlaylistLoadingSkeleton />
          ) : (
            currentItems?.map((x: Playlist) => (
              <PlaylistCard
                key={x.id}
                playlist={x}
                onPlaylistClick={() => {
                  navigate(`/playlist/${x.id}`);
                }}
                onNoDevicesFound={handleNoDevicesFound}
                onPlaySuccess={handlePlaySuccess}
              ></PlaylistCard>
            ))
          )}
        </div>
        <ReactPaginate
          breakLabel="..."
          pageLabelBuilder={(page) => (
            <div className={styles.pageItem}>{page}</div>
          )}
          className={styles.paginate}
          onPageChange={handlePageClick}
          activeClassName={styles.active}
          pageClassName={styles.pageItem}
          nextLabel={<ArrowForwardIcon />}
          nextClassName={styles.next}
          previousClassName={styles.previous}
          pageLinkClassName={'pageItem'}
          pageRangeDisplayed={2}
          pageCount={pageCount}
          previousLabel={<ArrowBackIcon />}
          renderOnZeroPageCount={null}
        />
      </main>
      <ToastContainer />
    </div>
  );
};
