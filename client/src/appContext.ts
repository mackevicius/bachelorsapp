import { createContext } from 'react';

export const defaultValue = {
  apiUrl:
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_API_URL_DEV
      : process.env.REACT_APP_API_URL_PROD,
  socketUrl:
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_SOCKET_URL_DEV ?? ''
      : process.env.REACT_APP_SOCKET_URL_PROD ?? '',
  redirectUri:
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_REDIRECT_URI_DEV
      : process.env.REACT_APP_REDIRECT_URI_PROD,
};

export const Context = createContext(defaultValue);
