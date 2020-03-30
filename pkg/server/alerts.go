package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/moolen/statusgraph/pkg/config"
	am "github.com/prometheus/alertmanager/api/v2/models"
	log "github.com/sirupsen/logrus"
)

func FetchAlerts(cfg *config.ServerConfig) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c := http.Client{
			Timeout: 10 * time.Second,
		}
		req, err := http.NewRequest(
			"GET",
			fmt.Sprintf("%s/api/v2/alerts", cfg.Upstream.Alertmanager.URL),
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

		alerts := make([]am.GettableAlert, 0)
		err = json.NewDecoder(res.Body).Decode(&alerts)
		if err != nil {
			log.Error(err)
			w.WriteHeader(http.StatusBadGateway)
			json.NewEncoder(w).Encode([]string{})
			return
		}

		log.Debugf("all alerts: %d", len(alerts))
		alerts, err = filterAlerts(cfg.Mapping.AlertConfig, alerts)
		log.Debugf("filtered alerts: %d", len(alerts))
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(alerts)
	}
}

func filterAlerts(cfg config.AlertMappingType, alerts []am.GettableAlert) ([]am.GettableAlert, error) {
	out := make([]am.GettableAlert, 0)
nextAlert:
	for _, alert := range alerts {
		for _, sel := range cfg.LabelSelector {
			match := true
			for k, v := range sel {
				if alert.Labels[k] != v {
					match = false
				}
			}
			if match {
				out = append(out, alert)
				continue nextAlert
			}
		}
	}
	return out, nil
}
