package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/moolen/statusgraph/pkg/config"
	prom "github.com/prometheus/client_golang/api/prometheus/v1"
	log "github.com/sirupsen/logrus"
)

type AvailableServicesResponse struct {
	AvailableServices []string `json:"available_services"`
}

func FetchAvailableServices(cfg *config.ServerConfig) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		seenValues := make(map[string]struct{})
		payload := AvailableServicesResponse{
			AvailableServices: make([]string, 0),
		}
		servicesFromLabels, err := fetchLabelValues(cfg)
		if err != nil {
			log.Error(err)
		}
		servicesFromRules, err := fetchServicesFromRules(cfg)
		if err != nil {
			log.Error(err)
		}
		for _, svc := range servicesFromLabels {
			if _, ok := seenValues[svc]; !ok {
				seenValues[svc] = struct{}{}
				payload.AvailableServices = append(payload.AvailableServices, svc)
			}
		}
		for _, svc := range servicesFromRules {
			if _, ok := seenValues[svc]; !ok {
				seenValues[svc] = struct{}{}
				payload.AvailableServices = append(payload.AvailableServices, svc)
			}
		}
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(payload)
	}
}

// fetchLabelValues returns all found labels and
// all errors. labelValues are never nil.
func fetchLabelValues(cfg *config.ServerConfig) ([]string, error) {
	seenValues := make(map[string]struct{})
	labelValues := make([]string, 0)
	c := http.Client{
		Timeout: 10 * time.Second,
	}
	var errs []string

	for _, label := range cfg.Mapping.MetricConfig.ServiceLabels {
		req, err := http.NewRequest(
			"GET",
			fmt.Sprintf("%s:/api/v1/label/%s/values", cfg.Upstream.Prometheus.URL, label),
			nil)
		if err != nil {
			errs = append(errs, fmt.Sprintf("[%s] error creating request: %s", label, err.Error()))
			continue
		}
		res, err := c.Do(req)
		if err != nil {
			errs = append(errs, fmt.Sprintf("[%s] error executing request: %s", label, err.Error()))
			continue
		}
		defer res.Body.Close()

		var r struct {
			Values []string `json:"data"`
		}
		err = json.NewDecoder(res.Body).Decode(&r)
		if err != nil {
			errs = append(errs, fmt.Sprintf("[%s] error decoding request: %s", label, err.Error()))
			continue
		}
		// label values can be csv
		for _, v := range r.Values {
			for _, v := range strings.Split(v, ",") {
				v = strings.Replace(v, " ", "", -1)
				if v == "" {
					continue
				}
				if _, ok := seenValues[v]; !ok {
					seenValues[v] = struct{}{}
				}
			}
		}
	}
	for svc := range seenValues {
		labelValues = append(labelValues, svc)
	}

	var err error
	if len(errs) > 0 {
		err = fmt.Errorf(strings.Join(errs, " "))
	}
	return labelValues, err
}

func fetchServicesFromRules(cfg *config.ServerConfig) (serviceList []string, err error) {
	seenValues := make(map[string]struct{})

	rules, err := fetchRules(cfg)
	if err != nil {
		return
	}
	for _, grp := range rules.Data.Groups {
		for _, r := range grp.Rules {
			switch rule := r.(type) {
			case prom.AlertingRule:
				log.Infof("got a alerting rule: %#v", rule)
				for k, v := range rule.Labels {
					for _, svclbl := range cfg.Mapping.AlertConfig.ServiceLabels {
						if string(k) == svclbl {
							if _, ok := seenValues[string(v)]; !ok {
								seenValues[string(v)] = struct{}{}
							}
						}
					}
				}
				for k, v := range rule.Annotations {
					for _, svclbl := range cfg.Mapping.AlertConfig.ServiceAnnotations {
						if string(k) == svclbl {
							if _, ok := seenValues[string(v)]; !ok {
								seenValues[string(v)] = struct{}{}
							}
						}
					}
				}
			default:
				log.Infof("unknown rule type %s", r)
				continue
			}
		}
	}
	for svc := range seenValues {
		serviceList = append(serviceList, svc)
	}
	return
}

func fetchRules(cfg *config.ServerConfig) (*RulesResponse, error) {
	c := http.Client{
		Timeout: 10 * time.Second,
	}
	req, err := http.NewRequest(
		"GET",
		fmt.Sprintf("%s/api/v1/rules", cfg.Upstream.Prometheus.URL),
		nil)
	if err != nil {
		return nil, err
	}
	res, err := c.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	payload := &RulesResponse{}
	err = json.NewDecoder(res.Body).Decode(payload)
	return payload, err
}
