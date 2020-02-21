package config

import (
	"io/ioutil"

	"gopkg.in/yaml.v3"
)

// FromFile ..
func FromFile(path string) (*ServerConfig, error) {
	f, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cfg ServerConfig
	err = yaml.Unmarshal(f, &cfg)
	return &cfg, err
}
