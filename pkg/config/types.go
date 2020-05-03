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
	Versions     UpstreamConfig `yaml:"versions" json:"versions"`
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
	LabelSelector      []LabelSelector `yaml:"label_selector" json:"label_selector"`
	ServiceLabels      []string        `yaml:"service_labels" json:"service_labels"`
	ServiceAnnotations []string        `yaml:"service_annotations" json:"service_annotations"`
}

// LabelSelector ..
type LabelSelector map[string]string

// MetricMappingType ..
type MetricMappingType struct {
	ServiceLabels []string `yaml:"service_labels" json:"service_labels"`
	Queries       []Query  `yaml:"queries" json:"queries"`
}

// Query ..
type Query struct {
	Name         string `yaml:"name" json:"name"`
	Query        string `yaml:"query" json:"query"`
	ServiceLabel string `yaml:"service_label" json:"service_label"`
}
