import WebSocket from 'ws';
import 'dotenv/config'; // To load .env variables

const WEBSOCKET_URL = process.env.VITE_OBS_WEBSOCKET_URL || 'ws://192.168.1.210:4455';

const ws = new WebSocket(WEBSOCKET_URL);

ws.on('open', function open() {
  console.log('connected');
  ws.close();
});

ws.on('error', function error(err) {
  console.error(err);
});
