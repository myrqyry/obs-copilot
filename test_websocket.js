import WebSocket from 'ws';

const ws = new WebSocket('ws://192.168.1.210:4455');

ws.on('open', function open() {
  console.log('connected');
  ws.close();
});

ws.on('error', function error(err) {
  console.error(err);
});
