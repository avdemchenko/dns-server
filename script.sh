#!/bin/bash

# IP and port of the DNS server
SERVER_IP="127.0.0.1"
SERVER_PORT=2053

# Construct a DNS request packet for google.com.
# This will include:
# - Transaction ID: 0x0001
# - Flags: 0x0100 (standard query)
# - Questions: 0x0001 (one question)
# - Answer RRs: 0x0000 (no answers)
# - Authority RRs: 0x0000 (no authority)
# - Additional RRs: 0x0000 (no additional)
# - Query for google.com:
#   - Name: 0x06 'google' 0x03 'com' 0x00
#   - Type: 0x0001 (A host address)
#   - Class: 0x0001 (IN)
QUERY=$(printf "\x00\x01\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00\x06google\x03com\x00\x00\x01\x00\x01")

# Send the DNS request and receive the response
echo -ne "$QUERY" | nc -u -w1 $SERVER_IP $SERVER_PORT

# Optionally listen for a response, if your script exits before showing it
# Uncomment the following line if you need to keep listening:
# nc -u -l -p $SERVER_PORT
