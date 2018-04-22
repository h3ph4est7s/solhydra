FROM ubuntu:rolling

RUN apt-get update \
  && apt-get install -y software-properties-common python-software-properties curl build-essential \
  && add-apt-repository ppa:ethereum/ethereum \
  && apt-get update \
  && apt-get install -y solc \
  && apt-get install -y libssl-dev \
  && apt-get install -y python3-dev \
  && curl https://bootstrap.pypa.io/get-pip.py | python3 \
  && ln -s /usr/bin/python3 /usr/local/bin/python \
  && python3 -m pip install --upgrade pip \
  && apt-get install -y pandoc \
  && apt-get install -y git \
  && python3 -m pip install laser-ethereum \
  && python3 -m pip install mythril \
  && curl --create-dirs -o ~/.mythril/signatures.json https://raw.githubusercontent.com/b-mueller/mythril/master/signatures.json \
  && curl -sL https://deb.nodesource.com/setup_8.x | bash - \
  && apt-get install -y nodejs

COPY markdown-fix.js /app/markdown-fix.js

# copy start script
COPY run.sh /app/run.sh

# copy patch
COPY error.patch /app/error.patch

# execute patch
RUN patch /usr/local/lib/python3.6/dist-packages/mythril/analysis/modules/integer.py < /app/error.patch

# execute start script
CMD ["sh", "/app/run.sh"]
