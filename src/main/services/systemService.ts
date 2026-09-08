import * as os from 'os';
import si from 'systeminformation';
import type { PortInfo, SystemInfo } from '../../shared/ipc';

export async function getSystemInfo(): Promise<SystemInfo> {
  const [load, memory] = await Promise.all([si.currentLoad(), si.mem()]);
  return {
    cpu: Number.isFinite(load.currentLoad) ? load.currentLoad : 0,
    memory: {
      total: memory.total,
      free: memory.available,
      used: memory.active,
      percent: memory.total > 0 ? ((memory.active / memory.total) * 100).toFixed(1) : '0',
    },
    platform: os.platform(),
    arch: os.arch(),
  };
}

export async function getOllamaPorts(): Promise<PortInfo[]> {
  const connections = await si.networkConnections();
  return connections
    .filter((connection) => connection.localPort === '11434' || connection.localPort === 11434)
    .map((connection) => ({
      local: `${connection.localAddress}:${connection.localPort}`,
      foreign: connection.peerAddress ? `${connection.peerAddress}:${connection.peerPort}` : '',
      state: connection.state ?? '',
      pid: String(connection.pid ?? ''),
    }));
}
