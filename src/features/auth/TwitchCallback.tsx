import React, { useEffect } from 'react';
import axios from 'axios';
import useConfigStore from '@/store/configStore';

const TwitchCallback: React.FC = () => {
  const {
    twitchClientId,
    twitchClientSecret,
    setTwitchAccessToken,
    setTwitchRefreshToken,
  } = useConfigStore();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');

    if (code) {
      const exchangeCodeForToken = async () => {
        try {
          const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
              client_id: twitchClientId,
              client_secret: twitchClientSecret,
              code,
              grant_type: 'authorization_code',
              redirect_uri: 'http://localhost:5173/auth/twitch/callback',
            },
          });

          const { access_token, refresh_token } = response.data;
          setTwitchAccessToken(access_token);
          setTwitchRefreshToken(refresh_token);
          window.location.href = '/?tab=twitch-chat';
        } catch (error) {
          console.error('Error exchanging code for token:', error);
          window.location.href = '/';
        }
      };

      exchangeCodeForToken();
    } else {
      window.location.href = '/';
    }
  }, [twitchClientId, twitchClientSecret, setTwitchAccessToken, setTwitchRefreshToken]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p>Authenticating with Twitch...</p>
    </div>
  );
};

export default TwitchCallback;
