# Statusgraph
A status page for your distributed system.

## Overview
This is a webapp that let's you visualize your system: create nodes and edges to draw your system architecture and signify dependencies. Annotate your services with Metrics and Alerts via `Prometheus` and `Alertmanager`.

## Requirements
* alertmanager v0.20.0 and above

## use-cases

You can visualize many different aspects of your environment
* 10.000ft view of your distributed system
* self-contained system of a single team (a bunch of services)
* network aspects: CDN, DNS & Edge services
* end-user view: edge services, blackbox tests
* Data engineering pipeline: visualize DAGs / ETL Metrics

## TODO

* R1 server-side storage
  * (x) pass mapping config to frontend (lookup idx)
  * (x) store graph-data and graph-config on the server side
  * (x) allow multiple stages (graph-data instances) to be rendered
  * (4) make them editable through web UI (Overlay / ACE Editor or so)

* R2 node-editor
  * (x) refactor node-editor in its own component
  * (x) fix: force re-render after edit
  * (x) edit: name, type, node_id
  * (3) save button / global enter to save values

* R3 tooltip: alertmapping & metrics
  * (x) implement tooltip component
  * (1) colorize node when alert matches
  * (x) display alerts in a tooltip on hover
  * (2) display metrics in a tooltip on hover

* R4 graph-config library (deps R1)
  * (3) implement config library with shapes
        consider using draw.io shapes (AWS/GCP..)

* R5 node cluster
  * (x) group nodes in a cluster
  * (1) move cluster

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
    url: http://foo:bar@prometheus.svc
  alertmanager:
    url: http://foo:bar@prometheus.svc
  servicegraph:
    url: http://foo:bar@prometheus.svc/my.svg

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
    map:
      label: "graph_node_id"

  metrics:
    # (for now) a single use-case is supported:
    #   we have a metric "availability:5m" with label graph_node_id
    #   and we want to map the label values to a node in the graph
    map:
      - metric: "tcp:availability:5m"
        label: "graph_node_id"
      - metric: "dns:availability:5m"
        label: "graph_node_id"
      - metric: "http:error:rate:5m"
        label: "graph_node_id"
```

## Client
* renders & updates the graph state
