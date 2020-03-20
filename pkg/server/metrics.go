package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/moolen/statusgraph/pkg/config"
	log "github.com/sirupsen/logrus"
)

type MetricResponse struct {
	AvailableServices []string `json:"available_services"`
	// map service_id => query => value
	Metrics map[string]map[string]string `json:"metrics"` // TODO: support TimeSeries?
}

type QueryResult struct {
	Status string `json:"status"`
	Data   struct {
		Type   string   `json:"resultType"`
		Result []Metric `json:"result"`
	} `json:"data"`
}

type Metric struct {
	Metric map[string]string `json:"metric"`
	Value  []interface{}     `json:"value"`
}

func FetchMetrics(cfg *config.ServerConfig) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var payload MetricResponse
		c := http.Client{
			Timeout: 10 * time.Second,
		}
		for _, label := range cfg.Mapping.ServiceLabels {
			req, err := http.NewRequest(
				"GET",
				fmt.Sprintf("%s:/api/v1/label/%s/values", cfg.Upstream.Prometheus.URL, label),
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
			defer res.Body.Close()

			var r struct {
				Values []string `json:"data"`
			}
			err = json.NewDecoder(res.Body).Decode(&r)
			if err != nil {
				log.Error(err)
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]bool{"ok": false})
				return
			}
			payload.AvailableServices = append(payload.AvailableServices, r.Values...)
		}

		for _, query := range cfg.Mapping.MetricConfig.Queries {
			u, err := url.Parse(fmt.Sprintf("%s/api/v1/query", cfg.Upstream.Prometheus.URL))
			if err != nil {
				log.Error(err)
				json.NewEncoder(w).Encode(map[string]bool{"ok": false})
				return
			}
			params := url.Values{}
			params.Add("query", query.Query)
			u.RawQuery = params.Encode()
			req, err := http.NewRequest(
				"GET",
				u.String(),
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
			defer res.Body.Close()
			var m QueryResult
			err = json.NewDecoder(res.Body).Decode(&m)
			if err != nil {
				log.Error(err)
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]bool{"ok": false})
				return
			}

			for _, r := range m.Data.Result {
				if payload.Metrics == nil {
					payload.Metrics = make(map[string]map[string]string)
				}
				svc := r.Metric[query.ServiceLabel]
				if svc == "" {
					log.Warnf("query (%s) missing service label (%s)", query.Name, query.ServiceLabel)
					continue
				}
				if len(r.Value) != 2 {
					log.Warnf("invalid metric value: %#v", r.Value)
					continue
				}
				// 1st: timestamp
				// 2nd: value
				val, ok := r.Value[1].(string)
				if !ok {
					log.Warnf("invalid metric value. could not cast to string")
					continue
				}
				if payload.Metrics[svc] == nil {
					payload.Metrics[svc] = make(map[string]string)
				}
				payload.Metrics[svc][query.Name] = val
			}
		}

		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(payload)
	}
}
