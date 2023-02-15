module github.com/moolen/statusgraph

go 1.14

replace k8s.io/client-go => k8s.io/client-go v0.17.3

require (
	github.com/albertogviana/prometheus-middleware v0.0.1
	github.com/go-openapi/strfmt v0.19.4 // indirect
	github.com/go-openapi/validate v0.19.5 // indirect
	github.com/google/go-cmp v0.5.5
	github.com/google/uuid v1.1.1
	github.com/gorilla/handlers v1.4.2
	github.com/gorilla/mux v1.7.4
	github.com/kr/pretty v0.2.0 // indirect
	github.com/prometheus/alertmanager v0.20.0
	github.com/prometheus/client_golang v1.11.1
	github.com/sirupsen/logrus v1.6.0
	github.com/spf13/afero v1.2.2 // indirect
	github.com/spf13/cobra v0.0.6
	github.com/spf13/pflag v1.0.5 // indirect
	github.com/spf13/viper v1.4.0
	gopkg.in/yaml.v3 v3.0.0-20200313102051-9f266ea9e77c
)
