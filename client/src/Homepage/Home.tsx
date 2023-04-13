import { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.scss';
import { PlaylistLoadingSkeleton } from '../common/PlaylistLoadingSkeleton';
import { Context } from '../appContext';
import axios from 'axios';
import ReactPaginate from 'react-paginate';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PlaylistCard } from './PlaylistCard';
import SearchBox from './SearchBox';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const COUNT = 20;

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

  const handleAddPlaylist = (playlistId: string) => {
    axios
      .post(
        context.apiUrl + '/addPlaylist',
        { playlistId },
        { withCredentials: true }
      )
      .then(() => {
        getPlaylists();
        toast('Playlist successfully added', {
          type: 'success',
          position: 'bottom-right',
          theme: 'colored',
        });
      })
      .catch((err) => {
        if (err.response.data === 'alreadyExists') {
          toast('Playlist already exists', {
            type: 'error',
            position: 'bottom-right',
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
            currentItems?.map((x: SpotifyApi.PlaylistBaseObject) => (
              <PlaylistCard
                key={x.id}
                playlist={x}
                onPlaylistClick={() => {
                  navigate(`/playlist/${x.id}`);
                }}
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
