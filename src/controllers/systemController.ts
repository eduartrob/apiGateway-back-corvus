import { Request, Response } from 'express';
import Docker from 'dockerode';
import os from 'os';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

let previousCpus = os.cpus();

export const streamHostStats = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('X-Accel-Buffering', 'no');

  const intervalId = setInterval(() => {
    try {
      const cpus = os.cpus();
      let user = 0;
      let nice = 0;
      let sys = 0;
      let idle = 0;
      let irq = 0;
      let total = 0;

      for (let i = 0; i < cpus.length; i++) {
        user += cpus[i].times.user - previousCpus[i].times.user;
        nice += cpus[i].times.nice - previousCpus[i].times.nice;
        sys += cpus[i].times.sys - previousCpus[i].times.sys;
        idle += cpus[i].times.idle - previousCpus[i].times.idle;
        irq += cpus[i].times.irq - previousCpus[i].times.irq;
      }

      total = user + nice + sys + idle + irq;
      const cpuPercent = total === 0 ? 0 : ((total - idle) / total) * 100;
      previousCpus = cpus;

      const totalMem = os.totalmem();
      const freeMem = os.freemem();

      const payload = {
        cpu_percent: cpuPercent.toFixed(2),
        mem_total: totalMem,
        mem_free: freeMem,
        uptime: os.uptime()
      };

      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (err) { }
  }, 2000);

  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
};

export const getContainers = async (req: Request, res: Response) => {
  try {
    const containers = await docker.listContainers({ all: true });
    
    const formatted = containers.map(c => ({
      id: c.Id.substring(0, 12),
      name: c.Names[0].replace('/', ''),
      image: c.Image,
      state: c.State,
      status: c.Status,
    }));
    
    res.status(200).json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching containers:', error.message);
    res.status(500).json({ success: false, message: 'Could not fetch containers. Make sure Docker socket is mounted.' });
  }
};

export const streamContainerStats = async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('X-Accel-Buffering', 'no');

  const containerId = req.params.id;

  if (!containerId) {
    res.write(`data: ${JSON.stringify({ error: 'No container ID provided' })}\n\n`);
    res.end();
    return;
  }

  try {
    const container = docker.getContainer(containerId as string);
    await container.inspect();

    const stream = await container.stats({ stream: true });
    
    stream.on('data', (chunk: Buffer) => {
      try {
        const stats = JSON.parse(chunk.toString('utf8'));
        
        let cpuPercent = 0.0;
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - (stats.precpu_stats.cpu_usage.total_usage || 0);
        const systemDelta = stats.cpu_stats.system_cpu_usage - (stats.precpu_stats.system_cpu_usage || 0);
        const cpuCount = stats.cpu_stats.online_cpus || stats.cpu_stats.cpu_usage.percpu_usage?.length || 1;
        
        if (systemDelta > 0.0 && cpuDelta > 0.0) {
          cpuPercent = (cpuDelta / systemDelta) * cpuCount * 100.0;
        }

        const memUsage = stats.memory_stats.usage || 0;
        const memLimit = stats.memory_stats.limit || 0;
        const memPercent = memLimit > 0 ? (memUsage / memLimit) * 100.0 : 0.0;
        
        const payload = {
          cpu_percent: cpuPercent.toFixed(2),
          mem_usage_bytes: memUsage,
          mem_limit_bytes: memLimit,
          mem_percent: memPercent.toFixed(2)
        };
        
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (e) { }
    });

    stream.on('end', () => res.end());
    stream.on('error', (err: any) => res.end());

    req.on('close', () => (stream as any).destroy());

  } catch (error: any) {
    console.error('Error starting stats stream:', error.message);
    res.write(`data: ${JSON.stringify({ error: 'Could not stream stats' })}\n\n`);
    res.end();
  }
};

export const streamContainerLogs = async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('X-Accel-Buffering', 'no');

  const containerId = req.params.id;

  if (!containerId) {
    res.write(`data: ${JSON.stringify({ error: 'No container ID provided' })}\n\n`);
    res.end();
    return;
  }

  try {
    const container = docker.getContainer(containerId as string);
    
    const logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      tail: 50,
      timestamps: true
    });

    logStream.on('data', (chunk: Buffer) => {
      let offset = 0;
      while (offset < chunk.length) {
        if (chunk.length - offset < 8) break;
        const type = chunk.readUInt8(offset);
        const length = chunk.readUInt32BE(offset + 4);
        offset += 8;
        
        if (offset + length <= chunk.length) {
          const payload = chunk.toString('utf8', offset, offset + length);
          const lines = payload.split('\n').filter(l => l.trim() !== '');
          
          for (const line of lines) {
            res.write(`data: ${JSON.stringify({ type: type === 2 ? 'stderr' : 'stdout', line })}\n\n`);
          }
        }
        offset += length;
      }
    });

    logStream.on('end', () => res.end());
    logStream.on('error', () => res.end());

    req.on('close', () => (logStream as any).destroy());

  } catch (error: any) {
    console.error('Error starting log stream:', error.message);
    res.write(`data: ${JSON.stringify({ error: 'Could not stream logs' })}\n\n`);
    res.end();
  }
};
