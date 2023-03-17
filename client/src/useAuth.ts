import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Context } from './appContext';

export default function useAuth(code: string) {
  const [accessToken, setAccessToken] = useState();
  const [refreshToken, setRefreshToken] = useState();
  const [expiresIn, setExpiresIn] = useState<number>();

  const context = useContext(Context);

  useEffect(() => {
    console.log(`${context.apiUrl}/login`);
    axios
      .post(`${context.apiUrl}/login`, {
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
        .post(`${context.apiUrl}/refresh`, {
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
