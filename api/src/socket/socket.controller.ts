import { Controller, Get } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';

@Controller()
export class SocketController {
  constructor(private readonly socketGateway: SocketGateway) {}

  @Get('broadcast')
  broadcastMessage() {
    this.socketGateway.server.emit('message', 'Hello from server!'); // Broadcasting message to all connected clients
    return 'Broadcasted!';
  }
}
