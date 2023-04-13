import {
  Autocomplete,
  Button,
  CircularProgress,
  debounce,
} from '@mui/material';
import React, { useContext, useMemo, useState } from 'react';
import styles from './Home.module.scss';
import axios from 'axios';
import { Context } from '../appContext';
import { CssTextField } from '../common/CssTextField';

export interface PlaceType {
  name: string;
  id: string;
  imageUrl: string;
}

interface Props {
  isPlaylistsLoading: boolean;
  onAddPlaylist: (playlistId: string) => void;
}

export const SearchBox: React.FC<Props> = ({
  isPlaylistsLoading,
  onAddPlaylist,
}) => {
  const [value, setValue] = useState<PlaceType | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [options, setOptions] = useState<readonly PlaceType[]>([]);
  const [optionsLoading, setOptionsLoading] = useState<boolean>(false);
  const context = useContext(Context);

  const styles2 = () => ({
    disabledButton: {
      backgroundColor: 'red',
    },
  });

  const search = (newValue: string) => {
    setOptionsLoading(true);
    axios
      .get(context.apiUrl + '/searchPlaylists?query=' + newValue, {
        withCredentials: true,
      })
      .then((res) => {
        const newOptions = res.data.playlists?.items.map(
          (x: SpotifyApi.PlaylistBaseObject) => {
            return {
              id: x.id,
              name: x.name,
              imageUrl: x.images[0].url,
            };
          }
        );
        setOptions(newOptions);
      })
      .finally(() => {
        setOptionsLoading(false);
      });
  };

  const debouncedChangeHandler = useMemo(() => debounce(search, 400), []);

  return (
    <div className={styles.searchBar}>
      <h1>Search for a playlist</h1>
      <Autocomplete
        id="asynchronous-demo"
        fullWidth={true}
        className={styles.searchBarInput}
        isOptionEqualToValue={(option, value) => option.name === value.name}
        getOptionLabel={(option) => option.name}
        onInputChange={(event, newValue) => {
          setInputValue(newValue);
          if (newValue !== '') {
            debouncedChangeHandler(newValue);
          }
        }}
        onChange={(event, value) => {
          setValue(value);
        }}
        options={options || []}
        loading={optionsLoading}
        noOptionsText="Nothing found, please specify"
        renderInput={(params) => (
          <CssTextField
            focusColor="#1db954"
            {...params}
            label="Enter a keyword"
            fullWidth={true}
            InputProps={{
              ...params.InputProps,

              endAdornment: (
                <React.Fragment>
                  {optionsLoading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
            InputLabelProps={{
              classes: {
                focused: styles.searchBarInput,
              },
            }}
          />
        )}
        renderOption={(props, options) => {
          return (
            <li
              {...props}
              key={options.id}
              style={{ display: 'flex', columnGap: 5 }}
            >
              <img
                width={35}
                height={35}
                src={options.imageUrl}
                alt={options.id}
              />
              {options.name}
            </li>
          );
        }}
      />
      <Button
        type="submit"
        variant="contained"
        color="success"
        sx={{
          backgroundColor: '#1db954',
          marginTop: '20px',
          fontFamily: 'Gotham Bold',
        }}
        size="large"
        onClick={() => onAddPlaylist(value?.id as string)}
        disabled={!value || isPlaylistsLoading}
        className={styles.searchButton}
      >
        Add Playlist Session
      </Button>
    </div>
  );
};

export default SearchBox;
