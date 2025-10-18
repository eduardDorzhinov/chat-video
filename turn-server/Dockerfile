FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y coturn nodejs npm && \
    apt-get clean

COPY config/turnserver.conf /etc/turnserver.conf

COPY server /server

EXPOSE 3478/tcp 3478/udp
EXPOSE 5349/tcp 5349/udp
EXPOSE 8080/tcp

CMD turnserver -c /etc/turnserver.conf -v & node /server/index.js
