# Statusgraph
A status page for your distributed system.

![](./statusgraph-svc.png)
![](./statusgraph-shop.png)

## Overview
This is a webapp that let's you visualize your system: create nodes and edges to draw your system architecture and signify dependencies. Annotate your services with Metrics and Alerts via `Prometheus` and `Alertmanager`.

Conceptually, you want to know if your service is "running", i.e. it is in a binary state: `red` lamp vs. `green` lamp.
This question is incredibly hard to answer. Statusgraph taks this approach: you define alerts via Prometheus which indicate a red/yellow lamp (service is dead / not available / has issues ..).
Additionally, you can map metrics

Alert Example:

```yaml
- alert: service_down
    expr: up == 0
    labels:
      severity: critical
      service_id: "{{ $labels.service_id }}" # this is known at alert-time
    annotations:
      description: Service {{ $labels.instance }} is unavailable.
      runbook: "http://example.com/foobar"
```

## Requirements
* alertmanager v0.20.0 and above
* prometheus

## use-cases

You can visualize many different aspects of your environment.
* 10.000ft view of your distributed system
* self-contained system of a single team (a bunch of services, databases)
* network aspects: CDN, DNS & Edge services
* end-user view: edge services, blackbox tests
* Data engineering pipeline: visualize DAGs / ETL Metrics

## Components
## Server
* communicates with prometheus to map metrics to a particular service (think: availability, error rate)
* asks alertmanager for active alerts

### Server Configuration
* contains the configuration for upstream
* contains the mapping for alerts and metrics

```yaml
upstream:
  prometheus:
    url: http://localhost:9090
  alertmanager:
    url: http://localhost:9093

mapping:
  # this defines how we select alerts to display
  # use a `labelSelector` to filter
  # and `map` to specify the lookup key in the alert struct
  alerts:
    labelSelector:
      # matches severity=critical OR (severity=warning AND important=true)
      - severity: "critical"
      - severity: "warning"
        important: "true"

    # red lamp indicator!
    # this tells statusgraph how to map the alerts on nodes in the graph:
    # by looking up a label or a annotation on the alert
    map:
      label: "service_id"
      annotation: "sid"

  # green lamp indicator!
  # this helps statusgraph to find all existing services by fetching the label values
  # reference: https://prometheus.io/docs/prometheus/latest/querying/api/#querying-label-values
  service_labels:
    - 'service_id'

  # metrics are displayed in a tooltip while hovering a node
  metrics:
    queries:
      #   we have a metric with label service_id
      #   and we want to map the label values to a node in the graph
      - name: CPU
        query: sum(rate(node_cpu_seconds_total[1m])) by (service_id)
        service_label: service_id
```

## Client
TBD

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

* R1 Backend
  * (x) pass mapping config to frontend (lookup idx)
  * (x) store graph-data and graph-config on the server side
  * (x) allow multiple stages (graph-data instances) to be rendered
  * (7) make them editable through web UI (Overlay / ACE Editor or so)

* R2 Graph UI
  * (x) implement tooltip component
  * (x) colorize node when alert matches
  * (x) display alerts in a tooltip on hover
  * (x) display metrics in a tooltip on hover
    * (x) :sparkles: add sparkline for metrics

  * R2.2 Node Clustering
    * (x) group nodes in a cluster
    * (x) move cluster

* R3 node-editor UI
  * (x) refactor node-editor in its own component
  * (x) fix: force re-render after edit
  * (x) edit: name, type, node_id
  * (x) implement input validation & display errors
  * (x) usability: auto focus service id on create
  * (x) usability: handle enter to save
  * (x) usability: handle hover with select
  * (x) usability: handle escape for exit

* R4 graph-config library
  * (3) implement config library with shapes
        consider using draw.io shapes (AWS/GCP..)


* R5 Misc. optimizations
  * metrics & alerts caching
  * decouple client and upstream requests

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
