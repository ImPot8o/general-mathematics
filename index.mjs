import Server from 'bare-server-node';
import http from 'http';
import nodeStatic from 'node-static';

const bare = new Server('/bare/', '');

const serve = new nodeStatic.Server('static/');
const fakeServe = new nodeStatic.Server('BlacklistServe/');

const server = http.createServer();

server.on('request', (request, response) => {
    try {
        const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
        // Code from NebulaServices
        var isLS = ip.startsWith('34.216.110') || ip.startsWith('54.244.51') || ip.startsWith('54.172.60') || ip.startsWith('34.203.250') || ip.startsWith('34.203.254');

        if (isLS) {
            fakeServe.serve(request, response, function (err, result) {
                if (err) {
                    console.error("Error serving 'BlacklistServe':", err.message);
                    response.writeHead(err.status, err.headers);
                    response.end();
                }
            });
        } else {
            if (bare.route_request(request, response)) {
                return;
            }

            serve.serve(request, response, function (err, result) {
                if (err) {
                    console.error("Error serving 'static':", err.message);
                    response.writeHead(err.status, err.headers);
                    response.end();
                }
            });
        }
    } catch (error) {
        console.error("Error handling request:", error);
        response.writeHead(500, {'Content-Type': 'text/plain'});
        response.end('Internal Server Error');
    }
});

server.on('upgrade', (req, socket, head) => {
    if (bare.route_upgrade(req, socket, head)) {
        return;
    }
    socket.end();
});

server.listen(8080, () => {
    console.log('Server is running on port 8080');
});
