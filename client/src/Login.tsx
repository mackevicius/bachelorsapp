import axios from 'axios';
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Context } from './appContext';

const Login = () => {
  const context = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('loggedIn')) navigate('/');
  }, []);
  return (
    <div>
      <a href={`${context.apiUrl}/login`}>Login</a>
    </div>
  );
};

export default Login;
