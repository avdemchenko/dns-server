export enum QRIndicator {
    QUERY = 0,
    RESPONSE = 1,
}

export enum Bool {
    FALSE = 0,
    TRUE = 1,
}

export enum OPCODE {
    QUERY = 0,
    IQUERY = 1,
    STATUS = 2,
}

export enum RCode {
    NOERROR = 0,
    FORMERR = 1,
    SERVFAIL = 2,
    NXDOMAIN = 3,
    NOTIMP = 4,
    REFUSED = 5,
}

export interface DNSHeader {
    ID: number;
    QR: QRIndicator;
    OPCODE: OPCODE;
    AA: Bool;
    TC: Bool;
    RD: Bool;
    RA: Bool;
    Z: 0;
    RCODE: RCode;
    QDCOUNT: number;
    ANCOUNT: number;
    NSCOUNT: number;
    ARCOUNT: number;
}

export enum RECORD_TYPE {
    A = 1, // host address
    NS = 2, // authoritative name server
    MD = 3, // mail destination (Obsolete - use MX)
    MF = 4, // mail forwarder (Obsolete - use MX)
    CNAME = 5, // canonical name for an alias
    SOA = 6, // marks the start of a zone of authority
    MB = 7, // mailbox domain name
    MG = 8, // mail group member
    MR = 9, // mail rename domain name
    NULL = 10, // null RR
    WKS = 11, // well known service description
    PTR = 12, // domain name pointer
    HINFO = 13, // host information
    MINFO = 14, // mailbox or mail list information
    MX = 15, // mail exchange
    TXT = 16, // text strings
}

export interface DNSQuestion {
    NAME: string;

    TYPE: RECORD_TYPE;

    CLASS: 1;
}

export interface DNSAnswer {
    NAME: string;

    TYPE: RECORD_TYPE;

    CLASS: 1;

    TTL: number;

    RDLENGTH: number;

    RDATA: Buffer;
}

export interface DNSObject {
    header: DNSHeader;
    questions: DNSQuestion[];
    answers?: DNSAnswer[];
    authority?: DNSAnswer[];
    additional?: DNSAnswer[];
}
