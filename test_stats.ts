import Docker from 'dockerode';
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

async function run() {
  const containers = await docker.listContainers();
  if (containers.length > 0) {
    const c = docker.getContainer(containers[0].Id);
    const stats = await c.stats({ stream: false });
    console.log(stats.name, stats.cpu_stats != null);
  }
}
run();
