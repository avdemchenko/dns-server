import * as dgram from "dgram";

describe('UDP Server', () => {
    let server: dgram.Socket;
    let client: dgram.Socket;

    beforeAll((done) => {
        server = dgram.createSocket("udp4");
        server.bind(2053, "127.0.0.1");
        server.on("message", (data: Buffer, remoteAddr: dgram.RemoteInfo) => {
            try {
                console.log(`Received data from ${remoteAddr.address}:${remoteAddr.port}`);
                const response = Buffer.from("ACK");
                server.send(response, remoteAddr.port, remoteAddr.address);
            } catch (e) {
                console.log(`Error sending data: ${e}`);
            }
        });
        server.on('listening', () => {
            done();
        });
    });

    afterAll(() => {
        server.close();
    });

    beforeEach(() => {
        client = dgram.createSocket("udp4");
    });

    afterEach(() => {
        client.close();
    });

    test('Server should receive messages and respond', done => {
        const message = Buffer.from("Hello server");

        client.on("message", (msg, info) => {
            expect(msg.toString()).toEqual("ACK");
            done();
        });

        client.send(message, 2053, "127.0.0.1", (err) => {
            if (err) {
                done(err);
            }
        });
    });
});
