import ReconnectingWebSocket from 'reconnecting-websocket';
import log from 'loglevel';
import { MessageType, MysterioHost } from 'constants.js';
import profileStore from 'stores/ProfileStore';
import { isDevEnv} from 'utils';

class Socket {
  constructor(chatWindowStore) {
    this.chatWindowStore = chatWindowStore;
    this.init();
  }

  init() {
    const SERVER_ADD = MysterioHost;
    const groupChatURL = this.chatWindowStore.roomId ? `/${this.chatWindowStore.roomId}` : '';
    const websocketProtocol = 'wss';
    this.socket = new ReconnectingWebSocket(
      `${websocketProtocol}://${SERVER_ADD}/ws/chat${groupChatURL}`
    );
    this.socket.addEventListener('open', this.handleOpen);
    this.socket.addEventListener('close', this.handleClose);
    this.socket.addEventListener('message', this.handleMessage);
  }

  handleOpen = () => {
    log.info('socket connection established, try sending messages');
    this.send(MessageType.USER_INFO, { name: profileStore.name, avatar: profileStore.avatarUrl });
  };

  handleClose = () => {
    log.info('socket connection closed, try later', this.socket);
  };

  handleMessage = (event) => {
    log.info('socket receive', event.data);
    const payload = JSON.parse(event.data);
    this.chatWindowStore.addMessage(payload);
  };

  send = (msgType, msgData) => {
    log.info('send over socket', msgData);
    const payload = {
      type: msgType,
      data: msgData,
    };
    this.socket.send(JSON.stringify(payload));
  };

  close = () => {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  };
}

export default Socket;
