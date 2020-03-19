package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/moolen/statusgraph/pkg/config"
	log "github.com/sirupsen/logrus"
)

func FetchMetrics(cfg *config.ServerConfig) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		for _, m := range cfg.Mapping.MetricConfig.Map {
			c := http.Client{
				Timeout: 10 * time.Second,
			}
			req, err := http.NewRequest(
				"GET",
				fmt.Sprintf("%s:/api/v1/label/%s/values", cfg.Upstream.Prometheus.URL, m.Label),
				nil)
			if err != nil {
				log.Error(err)
				json.NewEncoder(w).Encode(map[string]bool{"ok": false})
				return
			}
			res, err := c.Do(req)
			if err != nil {
				log.Error(err)
				json.NewEncoder(w).Encode(map[string]bool{"ok": false})
				return
			}
			log.Infof("%#v", res)
		}

		json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	}
}
