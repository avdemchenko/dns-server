import { DNSAnswer, DNSObject } from './types';

export class DNSBuilder {
    constructor(private dnsObject: DNSObject) {}

    private calculateSectionBufferSize(section: DNSAnswer[]): number {
        let sectionBufferSize = 0;
        for (const entry of section) {
            sectionBufferSize += 10;
            entry.NAME.split('.').forEach((label: string) => {
                sectionBufferSize += label.length + 1;
            });
            sectionBufferSize++;
            sectionBufferSize += entry.RDLENGTH;
        }
        return sectionBufferSize;
    }

    private writeSectionToBuffer(
        section: DNSAnswer[],
        buffer: Buffer,
        offset: number,
    ): number {
        for (const entry of section) {
            entry.NAME.split('.').forEach((label: string) => {
                buffer.writeUInt8(label.length, offset++);
                buffer.write(label, offset);
                offset += label.length;
            });
            buffer.writeUInt8(0, offset++);

            buffer.writeUInt16BE(entry.TYPE, offset);
            offset += 2;
            buffer.writeUInt16BE(entry.CLASS, offset);
            offset += 2;
            buffer.writeUInt32BE(entry.TTL, offset);
            offset += 4;
            buffer.writeUInt16BE(entry.RDLENGTH, offset);
            offset += 2;
            entry.RDATA.copy(buffer, offset);
            offset += entry.RDLENGTH;
        }
        return offset;
    }

    public toBuffer(): Buffer {
        const {
            header,
            questions,
            answers = [],
            authority = [],
            additional = [],
        } = this.dnsObject;
        try {
            const hBuffSize = 12;

            let qBuffSize = 0;
            for (const question of questions) {
                qBuffSize += 4; // 2 bytes for QTYPE and 2 bytes for QCLASS
                question.NAME.split('.').forEach((label: string) => {
                    qBuffSize += label.length + 1; // 1 byte for the length of the label
                });
                qBuffSize++; // for the terminating 0
            }

            const aBuffSize = this.calculateSectionBufferSize(answers);
            const nsBuffSize = this.calculateSectionBufferSize(authority);
            const arBuffSize = this.calculateSectionBufferSize(additional);

            const allocSize =
                hBuffSize + qBuffSize + aBuffSize + nsBuffSize + arBuffSize;
            const response: Buffer = Buffer.alloc(allocSize);

            response.writeUInt16BE(header.ID, 0);
            response.writeUInt16BE(
                (header.QR << 15) |
                (header.OPCODE << 11) |
                (header.AA << 10) |
                (header.TC << 9) |
                (header.RD << 8) |
                (header.RA << 7) |
                (header.Z << 4) |
                header.RCODE,
                2,
            );
            response.writeUInt16BE(header.QDCOUNT, 4);
            response.writeUInt16BE(header.ANCOUNT, 6);
            response.writeUInt16BE(header.NSCOUNT, 8);
            response.writeUInt16BE(header.ARCOUNT, 10);

            let offset = 12;
            for (const question of questions) {
                question.NAME.split('.').forEach((label: string) => {
                    response.writeUInt8(label.length, offset++);
                    response.write(label, offset);
                    offset += label.length;
                });
                response.writeUInt8(0, offset++); // write the terminating 0

                response.writeUInt16BE(question.TYPE, offset);
                offset += 2;
                response.writeUInt16BE(question.CLASS, offset);
                offset += 2;
            }

            offset = this.writeSectionToBuffer(answers, response, offset);
            offset = this.writeSectionToBuffer(authority, response, offset);
            offset = this.writeSectionToBuffer(additional, response, offset);

            return response;
        } catch (error) {
            return Buffer.alloc(0);
        }
    }
}
