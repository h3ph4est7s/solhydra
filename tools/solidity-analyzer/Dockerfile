FROM node:8.7.0-alpine

# need these deps for npm install
RUN apk add --no-cache python gcc g++ make git

# install truffle globally, required by solidity-coverage
RUN npm install --quiet --no-progress --global truffle

# download + install solidity-analyzer
RUN git clone https://github.com/quantstamp/solidity-analyzer.git && \
    cd solidity-analyzer && \
    npm i

# copy start script
COPY run.sh /app/run.sh

# execute start script
CMD ["sh", "/app/run.sh"]
