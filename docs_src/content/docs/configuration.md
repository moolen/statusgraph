# Configuration

This section is a reference for the command-line interface, usage of environment variable and `config.yaml` file.
Statusgraph has a simple client-server architecture. The Server serves the SPA Frontend, stores the graph data on disk and proxies metrics request to prometheus.

## CLI

The server serves the Webapp and is the API Server that stores the graph information and issues requests towards prometheus/alertmanager.

```
Usage:
  statusgraph server [flags]

Flags:
      --config string       path to the config file which contains the server configuration (default "/etc/statusgraph/config.yaml")
      --data-dir string     path to the data dir (default "/data")
  -h, --help                help for server
      --static-dir string   path to the static dir (default "/www")

Global Flags:
      --loglevel string   set the loglevel (default "info")
```

## Overview

This config file has three main purposes:
1. specify connection information for prometheus and alertmanager
2. define how statusgraph selects alerts and how to map them to a graph node
3. fetch metrics from prometheus and how to map them to a graph node

## Example

See the following annotated config example for further explanation.

```yaml
upstream:
  prometheus:
    # you can use http basic auth here in the form of http://user:pass@example.com
    url: http://localhost:9090
  alertmanager:
    url: http://localhost:9093

mapping:
  # this defines which alerts we display and how to find the correpsonding graph node
  # use a `label_selector` to filter for specific alerts
  # and `service_labels` and `service_annotations` to specify to which graph node this alert belongs
  alerts:
    label_selector:
      - severity: "critical"
      - severity: "warning"
        important: "true"

    # red & green lamp indicator
    # Use this if your alerts use a specific label for a service (e.g. app=frontend / app=backend ...)
    # this tells statusgraph to map alerts to nodes using the following labels/annotations
    service_labels:
      - "service_id"
    service_annotations:
      - "statusgraph-node"

  metrics:
    # green lamp indicator!
    # this helps statusgraph to find all existing services by fetching the label values
    # reference: https://prometheus.io/docs/prometheus/latest/querying/api/#querying-label-values
    service_labels:
      - 'service_id'

    queries:
      # just as an example
      - name: cpu wait
        query: sum(rate(node_pressure_cpu_waiting_seconds_total[1m])) by (service_id) * 100
        service_label: service_id
```
