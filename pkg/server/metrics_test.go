package server

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/moolen/statusgraph/pkg/config"
)

func TestFetchMetrics(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(metricsResponse))
	}))
	defer srv.Close()
	res, err := fetchMetrics(&config.ServerConfig{
		Upstream: config.UpstreamType{
			Prometheus: config.UpstreamConfig{
				URL: srv.URL,
			},
		},
		Mapping: config.MappingType{

			MetricConfig: config.MetricMappingType{
				ServiceLabels: []string{"service_id"},
				Queries: []config.Query{
					{
						Name:         "foo",
						Query:        "doesntmatter",
						ServiceLabel: "service_id",
					},
				},
			},
		},
	})
	if err != nil {
		t.Error(err)
	}
	expected := MetricResponse{
		Metrics: map[string]map[string][]TSValue{
			"Foobar": map[string][]TSValue{
				"foo": []TSValue{
					{
						Date:  "52181-04-15T09:46:40+01:00",
						Value: 0,
					},
					{
						Date:  "52181-04-15T09:46:40+01:00",
						Value: 0.5,
					},
					{
						Date:  "52181-04-15T09:46:40+01:00",
						Value: 1,
					},
				},
			},
		},
	}
	if !cmp.Equal(expected, res) {
		t.Errorf("unexpected response: %v, expected %v", res, expected)
	}

}

const metricsResponse = `
{
    "status": "success",
    "data": {
        "resultType": "matrix",
        "result": [
            {
                "metric": {
                    "__name__": "service:availability",
                    "service_id": "Foobar"
                },
                "values": [
                    [
                        1584515206000,
                        "0"
                    ],
                    [
                        1584515206000,
                        "0.5"
                    ],
                    [
                        1584515206000,
                        "1"
                    ]
                ]
            }
        ]
    }
}
`
