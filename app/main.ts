import * as dgram from "dgram";

console.log("Logs from your program will appear here!");

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

const parsePacket = (data: Buffer) => {
    const packetId = data.readInt16BE()
    const QDCOUNT = data.readInt16BE(4)
    const ANCOUNT = data.readInt16BE(6)
    const NSCOUNT = data.readInt16BE(8)
    const ARCOUNT = data.readInt16BE(10)
    let byte = data[2]
    const QR = (byte & (1 << 7)) && 1
    const OPCODE = (byte & (0b1111 << 3)) >> 3
    const AA = (byte & (1 << 2)) && 1
    const TC = (byte & (1 << 1)) && 1
    const RD = (byte & 1) && 1
    byte = data[3]
    const RA = (byte & (1 << 7)) && 1
    const Z = byte & (0b111 << 4)
    const RCODE = byte & 0b1111
    let index = 12
    const questions: Question[] = [...new Array(QDCOUNT).keys()].map(() => {
        let length = data[index++]
        let domainNameParts: string[] = []
        while (length !== 0) {
            domainNameParts.push(data.toString('binary', index, index + length))
            index += length
            length = data[index++]
        }
        const type = data.readInt16BE(index)
        const clas = data.readInt16BE(index + 2)
        index += 4
        return {
            domainName: domainNameParts.join('.'),
            type,
            class: clas
        }
    })
    return {
        questions,
        RA, Z, RCODE, RD, TC, AA, OPCODE, QR, QDCOUNT, packetId, ANCOUNT, NSCOUNT, ARCOUNT
    }
}

const mapping: Record<string, string> = {
    'codecrafters.io': '\x08\x08\x08\x08',
    'mail.google.com': '\x08\x08\x08\x08'
}

udpSocket.on("message", (data: Buffer, remoteAddr: dgram.RemoteInfo) => {
    try {
        console.log(`Received data from ${remoteAddr.address}:${remoteAddr.port}`);
        const query = parsePacket(data)
        console.log(query)
        const {questions, packetId, OPCODE, RD} = query
        const answers = questions.map((q) => ({
            type: 1,
            class: 1,
            ttl: 60,
            data: '\x08\x08\x08\x08',
            domainName: q.domainName
        }))
        const header = constructHeader({
            OPCODE,
            RD,
            packetId,
            QR: 1,
            QDCOUNT: questions.length,
            ANCOUNT: answers.length,
            RCODE: OPCODE === 0 ? 0 : 4
        })
        udpSocket.send(Buffer.concat([header, writeQuestions(questions), writeAnswers(answers)]), remoteAddr.port, remoteAddr.address);
    } catch (e) {
        console.log(`Error sending data: ${e}`);
    }
});
