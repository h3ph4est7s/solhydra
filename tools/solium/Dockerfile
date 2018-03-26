FROM node:8.7.0-alpine

# install solium globally
RUN npm install -g --quiet --no-progress solium

# copy solium config files
COPY .soliumrc.json /tmp/.soliumrc.json
COPY .soliumignore /tmp/.soliumignore

# copy start script
COPY run.sh /app/run.sh

# execute start script
CMD ["sh", "/app/run.sh"]
