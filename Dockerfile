FROM semtech/mu-javascript-template:1.6.0
LABEL maintainer="redpencil.io <info@repdencil.io>"
RUN apt-get update && apt-get -y upgrade && apt-get -y install curl