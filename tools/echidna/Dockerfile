FROM ubuntu:16.04

RUN apt-get update && \
    apt-get install -y curl software-properties-common libgmp-dev libbz2-dev libreadline-dev && \
    add-apt-repository -y ppa:ethereum/ethereum && \
    apt-get update && \
    apt-get install -y solc && \
    curl -sSL https://get.haskellstack.org/ | sh && \
    git clone https://github.com/trailofbits/echidna.git && \
    cd echidna && \
    stack upgrade && stack setup && stack install

# echidna-test will be in /root/.local/bin/echidna-test

COPY run.sh /app/run.sh

CMD ["sh", "/app/run.sh"]
