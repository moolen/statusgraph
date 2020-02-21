package config

// ServerConfig ..
type ServerConfig struct {
	Upstream UpstreamType `yaml:"upstream" json:"upstream"`
	Mapping  MappingType  `yaml:"mapping" json:"mapping"`
}

// UpstreamType ..
type UpstreamType struct {
	Prometheus   UpstreamConfig `yaml:"prometheus" json:"prometheus"`
	Alertmanager UpstreamConfig `yaml:"alertmanager" json:"alertmanager"`
	Servicegraph UpstreamConfig `yaml:"servicegraph" json:"servicegraph"`
}

// UpstreamConfig ..
type UpstreamConfig struct {
	URL string `yaml:"url" json:"url"`
}

// MappingType ..
type MappingType struct {
	AlertConfig  AlertMappingType  `yaml:"alerts" json:"alerts"`
	MetricConfig MetricMappingType `yaml:"metrics" json:"metrics"`
}

// AlertMappingType ..
type AlertMappingType struct {
	LabelSelector []LabelSelector   `yaml:"labelSelector" json:"labelSelector"`
	Map           map[string]string `yaml:"map" json:"map"`
}

// LabelSelector ..
type LabelSelector map[string]string

// MetricMappingType ..
type MetricMappingType struct {
	Map []MetricMap `yaml:"map" json:"map"`
}

// MetricMap ..
type MetricMap struct {
	Metric string `yaml:"metric" json:"metric"`
	Label  string `yaml:"label" json:"label"`
}
