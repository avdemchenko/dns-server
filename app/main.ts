import * as dgram from "dgram";

const udpSocket: dgram.Socket = dgram.createSocket("udp4");

udpSocket.bind(2053, "127.0.0.1");

const constructHeader = ({
                             QR = 0,
                             TC = 0,
                             RD = 0,
                             Z = 0,
                             RCODE = 0,
                             OPCODE = 0,
                             AA = 0,
                             RA = 0,
                             NSCOUNT = 0,
                             ARCOUNT = 0,
                             ANCOUNT = 0,
                             QDCOUNT = 0,
                             packetId = 0
                         }: {
    packetId?: number // 16 bits
    QR?: number // 1 bit
    OPCODE?: number // 4 bits
    AA?: number // 1 bit
    TC?: number // 1 bit
    RD?: number // 1 bit
    RA?: number // 1 bit
    Z?: number // 3 bits
    RCODE?: number // 4 bits
    QDCOUNT?: number // 16 bits
    ANCOUNT?: number // 16 bits
    NSCOUNT?: number // 16 bits
    ARCOUNT?: number // 16 bits
}) => {
    const buffer = Buffer.alloc(12);
    buffer.writeInt16BE(packetId)
    const computed = (QR << 15) + (OPCODE << 11) + (AA << 10) + (TC << 9) + (RD << 8) + (RA << 7) + (Z << 4) + RCODE
    buffer.writeInt16BE(computed, 2)
    buffer.writeInt16BE(QDCOUNT, 4)
    buffer.writeInt16BE(ANCOUNT, 6)
    buffer.writeInt16BE(NSCOUNT, 8)
    buffer.writeInt16BE(ARCOUNT, 10)
    return buffer
}

type Question = {
    type: number; class: number; domainName: string
}

const writeQuestions = (questions: Question[]) => {
    return Buffer.concat(questions.map((q) => {
        const typeAndClass = Buffer.alloc(4)
        const s = q.domainName.split('.').map(e => `${String.fromCharCode(e.length)}${e}`).join('')
        typeAndClass.writeInt16BE(q.type)
        typeAndClass.writeInt16BE(q.class, 2)
        return Buffer.concat([Buffer.from(s + '\0', 'binary'), typeAndClass])
    }))
}

type Answer = {
    domainName: string;
    type: number; // 2 bytes
    class: number; // 2 bytes
    ttl: number; // 4 bytes
    data: string
}

const writeAnswers = (answers: Answer[]) => {
    return Buffer.concat(answers.map((q) => {
        const buffer = Buffer.alloc(10)
        const s = q.domainName.split('.').map(e => `${String.fromCharCode(e.length)}${e}`).join('')
        buffer.writeInt16BE(q.type)
        buffer.writeInt16BE(q.class, 2)
        buffer.writeInt32BE(q.ttl, 4)
        buffer.writeInt16BE(q.data.length, 8)
        return Buffer.concat([Buffer.from(s + '\0', 'binary'), buffer, Buffer.from(q.data + '\0', 'binary')])
    }))
}

udpSocket.on("message", (data: Buffer, remoteAddr: dgram.RemoteInfo) => {
    try {
        console.log(`Received data from ${remoteAddr.address}:${remoteAddr.port}`);
        const questions: Question[] = [{class: 1, type: 1, domainName: 'google.com'}]
        const answers = [{
            type: 1,
            class: 1,
            ttl: 60,
            data: '\x08\x08\x08\x08',
            domainName: 'google.com'
        }]
        writeAnswers(answers)
        const header = constructHeader({packetId: 1234, QR: 1, QDCOUNT: questions.length, ANCOUNT: answers.length})
        udpSocket.send(Buffer.concat([header, writeQuestions(questions), writeAnswers(answers)]), remoteAddr.port, remoteAddr.address);
    } catch (e) {
        console.log(`Error sending data: ${e}`);
    }
});
