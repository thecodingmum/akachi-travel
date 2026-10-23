import { defineConfig } from 'vite';
import net from 'node:net';

// macOS AirPlay Receiver listens on *:5000. Vite binds 127.0.0.1:5000 directly
// (a specific address wins over the wildcard), and this plugin mirrors it on
// ::1 so http://localhost:5000 works whichever address "localhost" resolves to.
function ipv6Loopback(port) {
  return {
    name: 'ipv6-loopback-mirror',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const mirror = net.createServer((client) => {
          const upstream = net.connect(port, '127.0.0.1');
          client.pipe(upstream).pipe(client);
          const close = () => { client.destroy(); upstream.destroy(); };
          client.on('error', close);
          upstream.on('error', close);
        });
        mirror.on('error', () => {});
        mirror.listen(port, '::1');
        server.httpServer.once('close', () => mirror.close());
      });
    },
  };
}

export default defineConfig({
  server: { host: '127.0.0.1', port: 5000, strictPort: true },
  preview: { host: '127.0.0.1', port: 5000, strictPort: true },
  plugins: [ipv6Loopback(5000)],
});
