FROM ubuntu:16.04

RUN apt-get update \
  && apt-get install -y software-properties-common python-software-properties curl \
  && add-apt-repository ppa:ethereum/ethereum \
  && apt-get update \
  && apt-get install -y solc \
  && apt-get install -y libssl-dev \
  && apt-get install -y python3-pip python3-dev \
  && ln -s /usr/bin/python3 /usr/local/bin/python \
  && pip3 install --upgrade pip \
  && apt-get install -y pandoc \
  && apt-get install -y git \
  && pip3 install laser-ethereum \
  && pip3 install mythril \
  && curl --create-dirs -o ~/.mythril/signatures.json https://raw.githubusercontent.com/b-mueller/mythril/master/signatures.json \
  && curl -sL https://deb.nodesource.com/setup_8.x | bash - \
  && apt-get install -y nodejs

COPY markdown-fix.js /app/markdown-fix.js

# copy start script
COPY run.sh /app/run.sh

# execute start script
CMD ["sh", "/app/run.sh"]
