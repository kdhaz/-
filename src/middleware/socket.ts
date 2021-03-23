import { Server } from 'http';
import websocket from 'socket.io';

import { createWorker } from 'mediasoup';
import { ChatEvent } from '../types/chat';
import Room from './webrtc/room';
import { createWorkers, getMediasoupWorker } from './webrtc';
import Peer from './webrtc/peer';

let socket: websocket.Server;
const messageList: string[] = [];
const roomList = new Map<string, Room>();

const setRtc = (client: websocket.Socket) => {
  client.on('createRoom', (_, callback) => {
    callback('zoom');
  });

  client.on('join', (data: { roomId: string; name: string }, callback) => {
    const { roomId, name } = data;
    const peer = new Peer(client.id, name);
    const room = roomList.get('zoom');
    if (room) {
      room.addPeer(peer);
      callback(room.toJson());
      console.log(`---user joined--- "${roomId}": ${name}`);
    } else {
      console.error('failed to join room');
    }
  });

  client.on('getProducers', () => {
    const room = roomList.get('zoom');
    if (room == null) return;
    const peer = room.getPeers().get(client.id);
    if (peer) {
      console.log(`---get producers--- name:${peer.getName()}`);
      // send all the current producer to newly joined member
      const producerList = room.getProducerListForPeer(client.id);

      socket.emit('newProducers', producerList);
    }
  });

  client.on('getRouterRtpCapabilities', (_, callback) => {
    const room = roomList.get('zoom');
    if (room == null) return;
    const peer = room.getPeers().get(client.id);

    if (peer) {
      console.log(`---get RouterRtpCapabilities--- name: ${peer.getName()}`);
      try {
        callback(room.getRtpCapabilities());
      } catch (e) {
        callback({
          error: e.message,
        });
      }
    }
  });

  client.on('createWebRtcTransport', async (_, callback) => {
    const room = roomList.get('zoom');
    if (room == null) return;
    const peer = room.getPeers().get(client.id);
    if (peer) {
      console.log(`---create webrtc transport--- name: ${peer.getName()}`);
      try {
        const { params } = await room.createWebRtcTransport(client.id);
        callback(params);
      } catch (err) {
        console.error(err);
        callback({
          error: err.message,
        });
      }
    }
  });

  client.on('connectTransport', async ({ transportId, dtlsParameters }, callback) => {
    const room = roomList.get('zoom');
    if (room == null) return;
    const peer = room.getPeers().get(client.id);
    if (peer) {
      console.log(`---connect transport--- name: ${peer.getName()}`);
      await room.connectPeerTransport(client.id, transportId, dtlsParameters);
      callback('success');
    }
  });

  client.on('produce', async ({ kind, rtpParameters, producerTransportId }, callback) => {
    const room = roomList.get('zoom');
    if (room == null) {
      callback({ error: 'not is a room' });
      return;
    }
    const producerId = await room.produce(client.id, producerTransportId, rtpParameters, kind);
    const peer = room.getPeers().get(client.id);
    if (peer) {
      console.log(`---produce--- type: ${kind} name: ${peer.getName()} id: ${producerId}`);
    }
    callback(producerId);
  });

  client.on('consume', async ({ consumerTransportId, producerId, rtpCapabilities }, callback) => {
    // TODO null handling
    const room = roomList.get('zoom');
    if (room) {
      console.log(client.id);
      const params = await room.consume(client.id, consumerTransportId, producerId, rtpCapabilities);
      const peer = room.getPeers().get(client.id);
      if (peer && params) {
        console.log(params);
        console.log(`---consuming--- name: ${peer.getName()} prodId:${producerId} consumerId:${params.id}`);
      }
      callback(params);
    }
  });

  client.on('resume', async ({ consumerTransportId }, callback) => {
    const room = roomList.get('zoom');
    if (room == null) {
      callback();
      return;
    }

    const peer = room.getPeers().get(client.id);
    if (peer) {
      const consumer = peer.getConsumers().get(consumerTransportId);
      if (consumer) {
        await consumer.resume();
      }
    }
    callback();
  });

  client.on('getMyRoomInfo', (_, callback) => {
    const room = roomList.get('zoom');
    if (room == null) {
      callback();
      return;
    }
    callback(room.toJson());
  });

  client.on('disconnect', () => {
    const room = roomList.get('zoom');
    if (room == null) {
      return;
    }
    const peer = room.getPeers().get(client.id);
    if (peer) {
      console.log(`---disconnect--- name: ${peer.getName()}`);
      room.removePeer(client.id);
    }
  });

  client.on('producerClosed', ({ producerId }) => {
    const room = roomList.get('zoom');
    if (room == null) {
      return;
    }
    room.closeProducer(client.id, producerId);
    const peer = room.getPeers().get(client.id);
    if (peer) {
      console.log(`---producer close--- name: ${peer.getName()}`);
    }
  });

  client.on('exitRoom', async (_, callback) => {
    const room = roomList.get('zoom');
    if (room == null) {
      callback({ error: 'not currently in a room' });
      return;
    }
    const peer = room.getPeers().get(client.id);
    if (peer) {
      console.log(`---exit room--- name: ${peer.getName()}`);
      room.removePeer(client.id);
    }

    callback('successfully exited room');
  });
};

export const initWebSocket = async (server: Server) => {
  socket = new websocket.Server(server, {
    path: '/chat',
    serveClient: false,
    allowEIO3: true,
    cors: { origin: true, credentials: true },
  });

  await createWorkers();
  const worker = await getMediasoupWorker();
  roomList.set('zoom', new Room('zoom', worker, socket));

  socket.on(ChatEvent.CONNECTION, (client: websocket.Socket) => {
    console.log('connected', client.id);
    client.join('zoom');

    client.on(ChatEvent.NEW_MESSAGE, (message: string) => {
      messageList.push(message);
      socket.to('zoom').emit(ChatEvent.GET_MESSAGE, message);
    });

    setRtc(client);

    client.emit(ChatEvent.GET_ALL_MESSAGE, messageList);
  });

  socket.on(ChatEvent.DISCONNECT, () => {
    console.log('closed');
  });
};
