import { Command, Child } from '@tauri-apps/plugin-shell';
import { EditorResponse } from '../types/command.types';

class BackendService {
    private childProcess: Child | null = null;
    private responseCallbacks: Map<string, (data: EditorResponse) => void> = new Map();

    public isReady = false;

    async initialize() {
        const command = Command.sidecar('binaries/textpad_core');
        
        command.stdout.on('data', (line) => {
            //console.log("[cxx -> ts]:", line);
            this.handleIncomingMessage(line);
        });

        command.stderr.on('data', (line) => {
            console.error('[C++ STDERR]:', line);
        });

        this.childProcess = await command.spawn();
        this.isReady = true;
        console.log('C++ Backend sidecar successfully spawned PID:', this.childProcess.pid);
    }

    private handleIncomingMessage(rawPayload: string) {
        const cleanPayload = rawPayload.trim();
        const match = cleanPayload.match(/^OUTPUT:([^:]+):(.*)$/);
        if (!match) return;

        const [_, commandContext, jsonStr] = match;
        console.log('Raw JSON:', jsonStr);

        try {
            const data: EditorResponse = JSON.parse(jsonStr);
            if (this.responseCallbacks.has(commandContext)) {
                const callback = this.responseCallbacks.get(commandContext);
                if (callback) callback(data);
                this.responseCallbacks.delete(commandContext);
            } else if (data.error) {
                console.error('Backend Error:', data.error);
            }
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            console.error('Raw JSON that failed:', jsonStr);
        }
    }

    async sendCommand(
        action: 'CREATE' | 'OPEN' | 'DELETE' | 'STATS' | 'FIND' | 'SAVE' | 'SCAN', 
        payload: string
    ): Promise<EditorResponse> {
        if (!this.childProcess) {
            throw new Error('Backend service is not initialized.');
        }

        const formattedCommand = `${action}:${payload}\n`;
        
        return new Promise(async (resolve, reject) => {
            this.responseCallbacks.set(action, (response) => {
                resolve(response);
            });

            console.log(`[ts -> cxx]: ${formattedCommand}`)

            try {
                if (!this.childProcess){
                    throw new Error('Backend service is not initialized.');
                }
                await this.childProcess.write(formattedCommand);
            } catch (error) {
                this.responseCallbacks.delete(action);
                console.error('Failed to write to C++ sidecar:', error);
                reject(error);
            }
        });
    }

    async dispose() {
        if (this.childProcess) {
            await this.childProcess.kill();
            this.childProcess = null;
        }
    }
}

export const CoreService = new BackendService();