FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y coturn && \
    apt-get clean

COPY config/turnserver.conf /etc/turnserver.conf

EXPOSE 3478/tcp 3478/udp
EXPOSE 5349/tcp 5349/udp

CMD ["turnserver", "-c", "/etc/turnserver.conf", "-v"]
