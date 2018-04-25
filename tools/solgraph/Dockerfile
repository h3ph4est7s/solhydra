# if we use alpine, all text characters in the outputted PNG will be vertical rectangles (unrecognized)
FROM node:8.7.0

# install graphviz
RUN apt-get update -y && apt-get install -y git graphviz

# download + install solgraph
RUN git clone https://github.com/h3ph4est7s/solgraph.git && \
    cd solgraph && \
    git checkout add-new-solidity-features && \
    npm i && \
    npm run build

COPY png-to-dataurl.js /app/png-to-dataurl.js

# copy start script
COPY run.sh /app/run.sh

# execute start script
CMD ["sh", "/app/run.sh"]
