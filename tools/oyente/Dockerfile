FROM ubuntu:16.04

# we want latest solc version, therefore we don't use the Docker container provided by oyente
RUN apt-get update && \
    apt-get install -y build-essential software-properties-common && \
    add-apt-repository -y ppa:ethereum/ethereum && \
    apt-get update && \
    apt-get install -y solc ethereum python python-pip && \
    pip install oyente

COPY run.sh /app/run.sh

CMD ["sh", "/app/run.sh"]
