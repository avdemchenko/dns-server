#!/bin/bash

# Variables for IP and port
SERVER_IP="127.0.0.1"
SERVER_PORT=2053

# Create a minimal DNS-like request for google.com
# This request is highly simplified and for illustrative purposes only
QUERY=$(printf "\x04\xd2\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00\x06google\x03com\x00\x00\x01\x00\x01")

# Send the query to the server and listen for a response
echo -ne "$QUERY" | nc -u -w1 $SERVER_IP $SERVER_PORT

# Optionally, listen for a response if not automatically exiting
nc -u -l -p $SERVER_PORT
