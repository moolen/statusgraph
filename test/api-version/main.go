package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"net/http"

	log "github.com/sirupsen/logrus"
	"golang.org/x/exp/rand"

	"gopkg.in/yaml.v2"
)

type config struct {
	Versions []appVersion `yaml:"versions" json:"versions"`
}

type appVersion struct {
	Name    string `yaml:"name" json:"name"`
	Version string `yaml:"version" json:"version"`
}

func main() {
	cfgPath := flag.String("config", "config.yaml", "path to config file")
	flag.Parse()
	cfg := getConfig(*cfgPath)
	for i, v := range cfg.Versions {
		if v.Version == "" {
			nv := fmt.Sprintf("%d.%d.%d", rand.Intn(4), rand.Intn(44), rand.Intn(256))
			cfg.Versions[i].Version = nv
		}
	}
	http.Handle("/gimme", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(cfg.Versions)
	}))
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
