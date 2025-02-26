import React, { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Callback = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    
    if (code) {
      axios.post('https://www.reddit.com/api/v1/access_token', null, {
        params: {
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.REACT_APP_REDDIT_REDIRECT_URI,
        },
        auth: {
          username: process.env.REACT_APP_REDDIT_CLIENT_ID,
          password: process.env.REACT_APP_REDDIT_CLIENT_SECRET,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .then(response => {
        const accessToken = response.data.access_token;
        localStorage.setItem('reddit_access_token', accessToken);
        setIsAuthenticated(true);
        navigate('/');
      })
      .catch(error => {
        console.error('Error:', error);
        navigate('/');
      });
    }
  }, [navigate, setIsAuthenticated]);

  return <div>Loading...</div>;
};

export default Callback;