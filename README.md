# Simple http proxy server

This module based [proxy](https://www.npmjs.com/package/proxy) with little modification for my docker

### pull image

```bash
docker pull ghcr.io/fahridevz/simple-http-proxy-server:latest
```

### run docker image

```bash
docker run -d -t --restart=always -p 0.0.0.0:9875:9875/tcp --name simple-http-proxy ghcr.io/fahridevz/simple-http-proxy-server:latest
```
