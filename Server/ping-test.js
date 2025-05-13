import dns from 'dns';
import net from 'net';

const hosts = [
    'ac-dll6kwo-shard-00-00.hhp2uxz.mongodb.net',
    'ac-dll6kwo-shard-00-01.hhp2uxz.mongodb.net',
    'ac-dll6kwo-shard-00-02.hhp2uxz.mongodb.net'
];

hosts.forEach(host => {
    dns.resolve4(host, (err, addresses) => {
        if (err) {
            console.error(`DNS lookup failed for ${host}:`, err);
            return;
        }
        
        console.log(`${host} risolto a:`, addresses);
        
        addresses.forEach(ip => {
            const socket = new net.Socket();
            
            socket.setTimeout(5000);
            
            socket.on('connect', () => {
                console.log(`Connessione riuscita a ${host} (${ip}:27017)`);
                socket.destroy();
            });
            
            socket.on('error', (err) => {
                console.error(`Errore connessione a ${host} (${ip}:27017):`, err.message);
            });
            
            socket.on('timeout', () => {
                console.error(`Timeout connessione a ${host} (${ip}:27017)`);
                socket.destroy();
            });
            
            socket.connect(27017, ip);
        });
    });
});