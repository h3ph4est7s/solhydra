FROM luongnguyen/oyente

# we want latest solc version, therefore we don't use the Docker container provided by oyente
SHELL ["/bin/bash", "-c"]

RUN apt-get update -y && apt-get upgrade -y && \
    cd /tmp && \
    wget https://github.com/ethereum/solidity/releases/download/v0.4.23/solidity-ubuntu-trusty.zip && \
    unzip solidity-ubuntu-trusty.zip && \
    mv solc /usr/bin/solc

COPY run.sh /app/run.sh

CMD ["sh", "/app/run.sh"]
