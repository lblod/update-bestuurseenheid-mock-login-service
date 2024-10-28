FROM semtech/mu-javascript-template:1.6.0
LABEL maintainer="redpencil.io <info@repdencil.io>"
RUN apt update
RUN apt -y install curl