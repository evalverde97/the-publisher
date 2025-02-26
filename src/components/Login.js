import React from 'react';

const Login = () => {
    const handleLogin = () => {
        const clientId = process.env.REACT_APP_REDDIT_CLIENT_ID;
        const redirectUri = process.env.REACT_APP_REDDIT_REDIRECT_URI;
        const scope = 'submit identity';
        
        const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=random_string&redirect_uri=${redirectUri}&duration=permanent&scope=${scope}`;
      
        window.location.href = authUrl;
      };

    return (
        <div>
            <button onClick={handleLogin}>Login with Reddit</button>
        </div>
    );
};

export default Login;