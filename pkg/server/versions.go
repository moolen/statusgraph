package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/moolen/statusgraph/pkg/config"
	"github.com/prometheus/client_golang/prometheus"
	log "github.com/sirupsen/logrus"
)

// VersionGroup contains the service - version mapping
type VersionGroup struct {
	Name    string `yaml:"name" json:"name"`
	Version string `yaml:"version" json:"version"`
}

func FetchVersions(cfg *config.ServerConfig) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c := http.Client{
			Timeout: 10 * time.Second,
		}
		upstreamTimer := prometheus.NewTimer(upstreamDuration.WithLabelValues("versions", "version"))
		defer upstreamTimer.ObserveDuration()
		req, err := http.NewRequest(
			"GET",
			fmt.Sprintf("%s", cfg.Upstream.Versions.URL),
			nil)
		if err != nil {
			log.Error(err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode([]string{})
			return
		}
		res, err := c.Do(req)
		if err != nil {
			log.Error(err)
			w.WriteHeader(http.StatusBadGateway)
			json.NewEncoder(w).Encode([]string{})
			return
		}
		defer res.Body.Close()

		versions := make([]VersionGroup, 0)

		err = json.NewDecoder(res.Body).Decode(&versions)
		if err != nil {
			log.Error(err)
			w.WriteHeader(http.StatusBadGateway)
			json.NewEncoder(w).Encode([]string{})
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(versions)
	}
}
