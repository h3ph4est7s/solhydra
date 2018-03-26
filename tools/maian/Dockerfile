FROM ubuntu:16.04

# need ethereum + solc + pip web3
RUN apt-get update && apt-get install -y git python software-properties-common python-software-properties \
  && add-apt-repository ppa:ethereum/ethereum \
  && apt-get update \
  && apt-get install -y ethereum solc python-pip \
  && pip install --upgrade pip \
  && pip install z3-solver z3 web3

# download maian
RUN git clone https://github.com/MAIAN-tool/MAIAN.git

# copy start script
COPY /run.sh /app/run.sh

# execute start script
CMD ["sh", "/app/run.sh"]
