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
	ServiceLabels []string          `yaml:"service_labels" json:"service_labels"`
	AlertConfig   AlertMappingType  `yaml:"alerts" json:"alerts"`
	MetricConfig  MetricMappingType `yaml:"metrics" json:"metrics"`
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
	Queries []Query `yaml:"queries" json:"queries"`
}

// Query ..
type Query struct {
	Name         string `yaml:"name" json:"name"`
	Query        string `yaml:"query" json:"query"`
	ServiceLabel string `yaml:"service_label" json:"service_label"`
}
