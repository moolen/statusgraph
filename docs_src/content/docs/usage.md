# Usage examples

## Tutorial use-case: colorizing the nodes

Let's take a look at the following very simple graph:

```
[frontend] --> [backend]
```

Both services expose a metric `http_request_latency_seconds:mean5m` with labels `app=frontend` and `app=backend`.

And let's consider the following Alert rule as an **real life™** example.

```yaml
groups:
- name: Backend
  rules:
  - alert: HighRequestLatency
    expr: http_request_latency_seconds:mean5m{app="backend"} > 0.5
    for: 10m
    labels:
      severity: critical   # <--- we only want to display alerts with severity=critical
      service_id: backend # <--- this is a node in our graph
    annotations:
      summary: High request latency
```

The following mapping does this:
1. only take alerts with `severity=critical` into consideration and
2. the value of label `service_id` points to a node in our graph

```yaml
endpoints: {} # ...
metrics: {} # ...
mapping:
  alerts:
    label_selector:
      - severity: "critical"
    service_labels:
      - "service_id"
```

When this alert is firing, the `backend` will be **red**. pretty straight forward.
When the alert is NOT firing the `backend` will be **green**.

The frontend though will not be colorized in any way **because there is no mapping for it**.

How can we get this service green then? No, you don't have to define an alert for each service explicitly (tho you can do it of course!).
What you need is a `common label` that has all the available services as values. If you configured prometheus properly™ you have those labels already. In this tutorial we have `http_request_latency_seconds:mean5m` with labels `app=frontend` and `app=backend` (see above).

Use the `mapping.metrics.service_labels[]` config to tell statusgraph to lookup all values for label `app`.
```yaml
endpoints: {} # ...
metrics: {} # ...
mapping:
  metrics:
    service_labels:
      - app
```

If you don't have these labels yet, configure metric re-labeling (see [here](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#relabel_config) and [here](https://medium.com/quiq-blog/prometheus-relabeling-tricks-6ae62c56cbda)). As a last resort you can consider using [label_replace](https://prometheus.io/docs/prometheus/latest/querying/functions/#label_replace) with recorded rules.

## Matching multiple nodes in a graph
Complex systems fail in complex ways. For example, a http request may fail during DNS resolution, when doing a TCP handshake or if the wrong HTTP  status code is sent from the server. Thus, a simple alert may affect multiple nodes in the graph depending on your level abstraction.

This use-case is supported using csv in label values (yes, it's hacky. but that's how the prom spec is):

```yaml
groups:
- name: Backend
  rules:
  - alert: StupidHooman
    expr: all_cables_unplugged > 0
    for: 5m
    labels:
      severity: critical
      service_id: frontend,backend # use this to colorize 2 graph nodes at the same time
    annotations:
      summary: High request latency
```

## Generic Alerts
You can define generic alerts which re-use labels of a metric that

```yaml
groups:
- name: Backend
  rules:
  - alert: HighRequestLatency
    expr: http_request_latency_seconds:mean5m{app="backend"} > 0.5
    for: 10m
    labels:
      severity: critical   # <--- we only want to display alerts with severity=critical
      service_id: "{{ $labels.service_id }}" # <--- this is a node in our graph
    annotations:
      summary: High request latency
```
