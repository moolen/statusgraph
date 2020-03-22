package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/moolen/statusgraph/pkg/config"
	log "github.com/sirupsen/logrus"
)

type MetricResponse struct {
	AvailableServices []string `json:"available_services"`
	// map service_id => query => value
	Metrics map[string]map[string][]TSValue `json:"metrics"`
}

type TSValue struct {
	Date  string  `json:"date"`
	Value float64 `json:"value"`
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
	Value  [][]interface{}   `json:"values"`
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
			u, err := url.Parse(fmt.Sprintf("%s/api/v1/query_range", cfg.Upstream.Prometheus.URL))
			if err != nil {
				log.Error(err)
				json.NewEncoder(w).Encode(map[string]bool{"ok": false})
				return
			}
			params := url.Values{}
			params.Add("query", query.Query)
			params.Add("start", strconv.Itoa(int(time.Now().Add(-time.Minute*60).Unix())))
			params.Add("end", strconv.Itoa(int(time.Now().Unix())))
			params.Add("step", "60")
			u.RawQuery = params.Encode()
			log.Infof("q: %s", u)
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
					payload.Metrics = make(map[string]map[string][]TSValue)
				}
				svc := r.Metric[query.ServiceLabel]
				if svc == "" {
					log.Warnf("query (%s) missing service label (%s)", query.Name, query.ServiceLabel)
					continue
				}

				for _, v := range r.Value {
					if len(v) != 2 {
						log.Warnf("invalid metric value: %#v", v)
						continue
					}
					// 1st: timestamp
					// 2nd: value
					d, ok := v[0].(float64)
					if !ok {
						log.Warnf("invalid metric value. could not cast to string")
						continue
					}
					val, ok := v[1].(string)
					if !ok {
						log.Warnf("invalid metric value. could not cast to string")
						continue
					}
					if payload.Metrics[svc] == nil {
						payload.Metrics[svc] = make(map[string][]TSValue)
					}
					fv, err := strconv.ParseFloat(val, 64)
					if err != nil {
						log.Warnf("invalid metric value. could not parse to float")
						continue
					}
					mt := time.Unix(int64(d), 0)
					payload.Metrics[svc][query.Name] = append(payload.Metrics[svc][query.Name], TSValue{
						Date:  mt.Format(time.RFC3339),
						Value: fv,
					})
				}

			}
		}

		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(payload)
	}
}
