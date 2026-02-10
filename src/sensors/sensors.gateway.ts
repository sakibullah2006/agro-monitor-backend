import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SensorsService } from './sensors.service';

@WebSocketGateway({ cors: true })
export class SensorsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private highPriorityInterval: NodeJS.Timeout;
    private lowPriorityInterval: NodeJS.Timeout;

    constructor(private readonly sensorsService: SensorsService) {
        this.startBroadcasting();
    }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    private startBroadcasting() {
        // High Priority (Fast): Temperature and pH (Every 2 seconds)
        this.highPriorityInterval = setInterval(() => {
            this.broadcastSensorData(['TEMP_01', 'PH_01']);
        }, 1000);

        // Low Priority (Slow): Salinity, Turbidity, DO (Every 5 seconds)
        // Spec said 5-10 seconds. Choosing 5 seconds.
        this.lowPriorityInterval = setInterval(() => {
            this.broadcastSensorData(['SAL_01', 'TURB_01', 'DO_01', 'WCOLOR']);
        }, 1500);
    }

    private broadcastSensorData(sensorIds: string[]) {
        sensorIds.forEach(id => {
            try {
                const data = this.sensorsService.generateNextValue(id);
                // Emit to sensor-specific channel (e.g., 'TEMP_01')
                this.server.emit(id, data);
                // Optional: Ensure payload matches requirements (Dto handles structure, here we just emit)
            } catch (error) {
                console.error(`Error generating data for ${id}:`, error.message);
            }
        });
    }
}
