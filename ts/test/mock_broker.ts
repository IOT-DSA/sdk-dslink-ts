import http from 'http';
import WebSocket from 'ws';
import {AddressInfo} from "net";


class Client {
  server: MockServer;
  socket: WebSocket;

  paired: Client;

  queued: WebSocket.Data[] = [];

  constructor(server: MockServer, socket: WebSocket) {
    this.server = server;
    this.socket = socket;
    socket.send('{}');
    socket.on('message', this.onMessage);
    socket.on('close', this.onMessage);
  }

  pair(client: Client) {
    if (client) {
      this.paired = client;
      if (client.paired !== this) {
        client.pair(this);
      }
      if (this.queued) {
        for (let data of this.queued) {
          client.forward(data);
        }
      }
    }
  }

  forward(data: WebSocket.Data) {
    this.socket.send(data);
  }

  onMessage = (data: WebSocket.Data) => {
    if (this.paired) {
      this.paired.forward(data);
    } else {
      this.queued.push(data);
    }
  };
  onClose = () => {
    if (this.server) {
      this.server.disconnect();
    }
  };

  destroy() {
    this.socket.close();
    this.server = null;
    this.paired = null;
  }
}

const connResponse = {
  "dsId": "broker-dsa-FEuG-dsvoy3Mfh-DY4ZLqxWdcjA9mky2MyCd0DmqTMw",
  "publicKey": "BG4OYopcM2q09amKRKsc8N99ns5dybnBYG4Fi8bQVf6fKjyT_KRlPMJCs-3zvnSbBCXzS5fZfi88JuiLYwJY0gc",
  "wsUri": "/ws",
  "path": "/",
  "version": "1.1.2",
  "format": "json"
};

export class MockServer {
  server = http.createServer((req, resp) => {
    if (req.url.includes('format=msgpack')) {
      connResponse.format = 'msgpack';
    } else {
      connResponse.format = 'json';
    }
    var body = JSON.stringify(connResponse);
    var content_length = body.length;
    resp.writeHead(200, {
      'Content-Length': content_length,
      'Content-Type': 'application/json'
    });
    resp.end(body);
  });
  serverSocket = new WebSocket.Server({server: this.server});

  onListen: Promise<number>;

  requester: Client;
  responder: Client;

  constructor() {
    this.serverSocket.on('connection', (socket: WebSocket, request: http.IncomingMessage) => {
      console.log('ws');
      if (request.url.includes('dsId=requester')) {
        if (this.requester) {
          this.disconnect();
        }
        this.requester = new Client(this, socket);
        this.requester.pair(this.responder);
      } else if (request.url.includes('dsId=responder')) {
        if (this.responder) {
          this.disconnect();
        }
        this.responder = new Client(this, socket);
        this.responder.pair(this.requester);
      }
    });
    this.onListen = new Promise<number>((resolve) => {
      this.server.listen(0, '127.0.0.1', () => {
        console.log(this.server.address() as AddressInfo);
        resolve((this.server.address() as AddressInfo).port);
      });
    });
  }

  disconnect() {
    if (this.requester) {
      this.requester.destroy();
      this.requester = null;
    }
    if (this.responder) {
      this.responder.destroy();
      this.responder = null;
    }
  }

  destroy() {
    this.disconnect();
    this.server.close();
  }
}
