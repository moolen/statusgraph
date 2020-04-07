package main

import (
	"flag"
	"io/ioutil"
	"math/rand"
	"net/http"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"gopkg.in/yaml.v2"
)

type config struct {
	Metrics []metric `yaml:"metrics"`
}

type metric struct {
	Name   string            `yaml:"name"`
	Labels map[string]string `yaml:"labels"`
	gauge  prometheus.Gauge
}

func main() {
	cfgPath := flag.String("config", "config.yaml", "path to config file")
	flag.Parse()
	cfg := getConfig(*cfgPath)
	for i, metric := range cfg.Metrics {
		cfg.Metrics[i].gauge = promauto.NewGauge(prometheus.GaugeOpts{
			Name:        metric.Name,
			ConstLabels: prometheus.Labels(metric.Labels),
			Help:        metric.Name + " help NOOP",
		})
	}
	go func() {
		for {
			for _, metric := range cfg.Metrics {
				metric.gauge.Set(rand.Float64())
			}
			<-time.After(time.Second * 3)
		}
	}()
	http.Handle("/metrics", promhttp.Handler())
	log.Infof("listening on :3000")
	http.ListenAndServe(":3000", nil)
}

func getConfig(path string) config {
	d, err := ioutil.ReadFile(path)
	if err != nil {
		log.Fatal("error reading file: ", err)
	}
	var cfg config
	err = yaml.Unmarshal(d, &cfg)
	if err != nil {
		log.Fatal("error unmarshaling config: ", err)
	}
	return cfg
}
