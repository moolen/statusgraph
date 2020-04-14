# Statusgraph
A status page for your distributed system.

![](./statusgraph-shop.png)

## TLDR;

Try the UI (without colors):
```
$ docker run -it -p 8000:8000 quay.io/moolen/statusgraph:latest server
```

## Install & Documentation

Docs are here: https://moolen.github.io/statusgraph/

## Status
This is an experimental app.

## Roadmap
#### graph import & streaming
* i want to import the graph configuration from different file formats (plantuml, dot..)
* right now the graph configuration is static. This works for a logical representation. But computing environments are very dynamic, so
 i want to stream the graph configuration via an API
  * do we need a hybrid approach? (cluster per dynamic-api AND static config?)
  * which upstream API to spike? How do we determine the edges? kubernetes/$CLOUD?
  * can we use traces (L3/4: tcp/udp/ip via eBPF, L7 via opentracing?) to determine the nodes and edges?

#### further customization
* as a user i want to cross-reference other services (e.g. grafana) from the tooltip (e.g. link to dashboard, runbook etc.)

## TODO

* [x] add direction arrow to edge
* [x] highlight adjacent nodes & edges
* [ ] graph-config library
  * implement config library with shapes, consider using draw.io shapes (AWS/GCP..)
* [ ] Misc. optimizations
  * metrics & alerts caching
  * decouple client and upstream requests
* [ ] implement UI tests
* [ ] comprehensive documentation w/ examples
* [x] enhance integration-test (custom prom-exporter for testing purposes)

## Developing

Run Server

```
$ make binary
$ ./bin/statusgraph server --config ./config.yaml
```

Run Test Infra

```
$ cd hack
$ docker-compose up  -d

# test failure
$ docker-compose stop cart.svc
```

Run Client

```
$ cd client; npm install; npm run watch
```

You can access prometheus via `localhost:9090`, alertmanager via `localhost:9093` and the backend (which serves the SPA too) via `localhost:8000`.
