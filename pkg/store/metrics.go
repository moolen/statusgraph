package store

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	storageOps = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "statusgraph_storage_operations",
		Help: "number of storage operations",
	}, []string{"operation"})
)
