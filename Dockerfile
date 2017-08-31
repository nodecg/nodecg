FROM node:8

# User and group arguments
ARG user=nodecg
ARG group=nodecg
ARG gid=1001
ARG uid=1001

# Create a non-root user
RUN groupadd -r -g ${gid} ${group}  &&\
    useradd --no-log-init -r -u ${uid} -g ${group} ${user} &&\
    mkdir /home/${user} && chown -R ${user}:${group} /home/${user}

# Install bower cli
RUN yarn global add bower

# Set workdir
WORKDIR /opt/nodecg/

# Copy nodecg into the workdir
COPY . /opt/nodecg/

# Set permissions
RUN chown -R ${user}:${group} . &&\
    chmod 744 .

# Login as nodecg
USER ${user}

# Setup mountable volumes
RUN mkdir cfg && mkdir bundles && mkdir logs && mkdir db

# Install dependencies
RUN yarn install --prod
RUN bower install

# Expose volumes
# Volumes that are mounted need to have read and write permission for user nodecg with uid=1001 or group nodecg gid=1001
# You can set the dir ownership with ´chown -R 1001:1001 [directory]´ or you can give everyone read and write
# permissions with ´chmod -R 666 [directory]´
# (you may need root permissions to change read and write permissions or directory ownership)
VOLUME ["/opt/nodecg/cfg/", "/opt/nodecg/bundles/", "/opt/nodecg/db/"]

# Expose standard port
EXPOSE 9090

# The command to run
CMD ["node", "index.js"]
