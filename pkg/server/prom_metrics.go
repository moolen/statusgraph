package server

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	upstreamDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name: "statusgraph_upstream_duration_seconds",
		Help: "Duration of upstream HTTP requests.",
	}, []string{"upstream", "api"})
)
