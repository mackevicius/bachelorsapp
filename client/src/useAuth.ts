import { useState, useEffect } from 'react';
import axios from 'axios';

export const getApiUrl = () => {
  if (process.env.NODE_ENV === 'development')
    return process.env.REACT_APP_API_URL_DEV;
  return process.env.REACT_APP_API_URL_PROD;
};

export default function useAuth(code: string) {
  const [accessToken, setAccessToken] = useState();
  const [refreshToken, setRefreshToken] = useState();
  const [expiresIn, setExpiresIn] = useState<number>();

  useEffect(() => {
    console.log(`${getApiUrl()}/login`);
    axios
      .post(`${getApiUrl()}/login`, {
        code,
      })
      .then((res) => {
        console.log((res.data.expiresIn - 60) * 1000);
        setAccessToken(res.data.accessToken);
        setRefreshToken(res.data.refreshToken);
        setExpiresIn(res.data.expiresIn);
        window.history.pushState({}, '', '/');
      })
      .catch((err) => {
        window.location = '/' as any;
      });
  }, [code]);

  useEffect(() => {
    if (!refreshToken || !expiresIn) return;
    const interval = setInterval(() => {
      axios
        .post(`${getApiUrl()}/refresh`, {
          refreshToken,
        })
        .then((res) => {
          setAccessToken(res.data.accessToken);
          setExpiresIn(res.data.expiresIn);
        })
        .catch(() => {
          window.location = '/' as any;
        });
    }, (expiresIn - 60) * 1000);

    return () => clearInterval(interval);
  }, [refreshToken, expiresIn]);

  return accessToken;
}
