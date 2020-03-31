package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/moolen/statusgraph/pkg/config"
	prom "github.com/prometheus/client_golang/api/prometheus/v1"
	"github.com/prometheus/client_golang/prometheus"
	log "github.com/sirupsen/logrus"
)

type MetricResponse struct {
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

type RulesResponse struct {
	Status string           `json:"status"`
	Data   prom.RulesResult `json:"data"`
}

func FetchMetrics(cfg *config.ServerConfig) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		payload, err := fetchMetrics(cfg)
		if err != nil {
			log.Error(err)
		}
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(payload)
	}
}

func fetchMetrics(cfg *config.ServerConfig) (payload MetricResponse, errors error) {
	var errs []string
	payload.Metrics = make(map[string]map[string][]TSValue)
	c := http.Client{
		Timeout: 10 * time.Second,
	}
	for i, query := range cfg.Mapping.MetricConfig.Queries {
		u, err := url.Parse(fmt.Sprintf("%s/api/v1/query_range", cfg.Upstream.Prometheus.URL))
		if err != nil {
			errs = append(errs, fmt.Sprintf("[%d] error parsing url: %s", i, err))
			continue
		}
		params := url.Values{}
		params.Add("query", query.Query)
		params.Add("start", strconv.Itoa(int(time.Now().Add(-time.Minute*60).Unix())))
		params.Add("end", strconv.Itoa(int(time.Now().Unix())))
		params.Add("step", "60")
		u.RawQuery = params.Encode()
		log.Infof("q: %s", u)
		upstreamTimer := prometheus.NewTimer(upstreamDuration.WithLabelValues("prometheus", "query_range"))
		req, err := http.NewRequest(
			"GET",
			u.String(),
			nil)
		if err != nil {
			errs = append(errs, fmt.Sprintf("[%d] error creating request: %s", i, err))
			continue
		}
		res, err := c.Do(req)
		if err != nil {
			errs = append(errs, fmt.Sprintf("[%d] error executing request: %s", i, err))
			continue
		}
		upstreamTimer.ObserveDuration()
		defer res.Body.Close()
		var m QueryResult
		err = json.NewDecoder(res.Body).Decode(&m)
		if err != nil {
			errs = append(errs, fmt.Sprintf("[%d] error decoding response: %s", i, err))
			continue
		}

		for _, r := range m.Data.Result {
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
	if len(errs) != 0 {
		errors = fmt.Errorf(strings.Join(errs, ", "))
	}
	return
}
