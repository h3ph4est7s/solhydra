FROM node:8.7.0

# install solhint globally
RUN npm install -g --quiet --no-progress solhint

# copy start script
COPY run.sh /app/run.sh

# execute start script
CMD ["sh", "/app/run.sh"]
