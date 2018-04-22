FROM node:8.7.0

# need these deps for npm install
RUN apt-get install python gcc g++ make git

# download + install solidity-analyzer
RUN git clone https://github.com/quantstamp/solidity-analyzer.git && \
    cd solidity-analyzer && \
    npm i

# copy patch
COPY error.patch /app/error.patch

# execute patch
RUN patch /solidity-analyzer/lib/astvisitor.js < /app/error.patch

# copy start script
COPY run.sh /app/run.sh

# execute start script
CMD ["sh", "/app/run.sh"]
