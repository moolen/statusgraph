package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/moolen/statusgraph/pkg/config"
)

func TestFetchAvailableServices(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		res := FetchSvcMap[r.URL.Path]
		w.Write([]byte(res))
	}))
	defer srv.Close()

	for i, row := range []struct {
		cfg              *config.ServerConfig
		expectedStatus   int
		expectedServices []string
	}{
		{
			// zero config
			cfg: &config.ServerConfig{
				Upstream: config.UpstreamType{
					Prometheus: config.UpstreamConfig{
						URL: srv.URL,
					},
				},
			},
			expectedStatus:   http.StatusOK,
			expectedServices: []string{},
		},
		{
			// should fetch services from metrics only
			cfg: &config.ServerConfig{
				Upstream: config.UpstreamType{
					Prometheus: config.UpstreamConfig{
						URL: srv.URL,
					},
				},
				Mapping: config.MappingType{
					AlertConfig: config.AlertMappingType{
						ServiceLabels: []string{},
					},
					MetricConfig: config.MetricMappingType{
						ServiceLabels: []string{"foo"},
					},
				},
			},
			expectedStatus:   http.StatusOK,
			expectedServices: []string{"foo", "far", "faz", "fang"},
		},
		{
			// should fetch services from alerts via label and annotation
			cfg: &config.ServerConfig{
				Upstream: config.UpstreamType{
					Prometheus: config.UpstreamConfig{
						URL: srv.URL,
					},
				},
				Mapping: config.MappingType{
					AlertConfig: config.AlertMappingType{
						ServiceLabels:      []string{"service_id"},
						ServiceAnnotations: []string{"something"},
					},
					MetricConfig: config.MetricMappingType{
						ServiceLabels: []string{},
					},
				},
			},
			expectedStatus:   http.StatusOK,
			expectedServices: []string{"one", "two", "this.svc", "other.svc", "{{ $labels.service_id }}"},
		},
		{
			// should get from all sources
			cfg: &config.ServerConfig{
				Upstream: config.UpstreamType{
					Prometheus: config.UpstreamConfig{
						URL: srv.URL,
					},
				},
				Mapping: config.MappingType{
					AlertConfig: config.AlertMappingType{
						ServiceLabels:      []string{"service_id"},
						ServiceAnnotations: []string{"something"},
					},
					MetricConfig: config.MetricMappingType{
						ServiceLabels: []string{"foo", "bar"},
					},
				},
			},
			expectedStatus: http.StatusOK,
			expectedServices: []string{
				"foo", "far", "faz", "fang",
				"boo", "bar", "baz", "bang",
				"one", "two",
				"this.svc", "other.svc", "{{ $labels.service_id }}"},
		},
	} {
		res := httptest.NewRecorder()
		FetchAvailableServices(row.cfg)(res, nil)
		if res.Code != row.expectedStatus {
			t.Errorf("[%d]expected status %d, got: %d", i, row.expectedStatus, res.Code)
		}
		var srvRes AvailableServicesResponse
		err := json.NewDecoder(res.Body).Decode(&srvRes)
		if err != nil {
			t.Error(err)
		}

		if !cmpArr(srvRes.AvailableServices, row.expectedServices) {
			t.Errorf("[%d]expected services %s, got: %s", i, row.expectedServices, srvRes.AvailableServices)
		}
	}
}

var FetchSvcMap = map[string]string{
	"/api/v1/label/foo/values": `{"status":"success","data":["foo,far","faz","fang",""]}`,
	"/api/v1/label/bar/values": `{"status":"success","data":["boo,bar","baz","bang",""]}`,
	"/api/v1/rules":            rulesResponse,
}

func TestFetchServicesFromRules(t *testing.T) {
	tbl := []struct {
		inputLabels      []string
		inputAnnotations []string
		output           []string
		err              bool
	}{
		{
			inputLabels:      []string{},
			inputAnnotations: []string{"something"},
			output:           []string{"one", "two"},
			err:              false,
		},
		{
			inputLabels:      []string{"service_id"},
			inputAnnotations: []string{},
			output:           []string{"this.svc", "other.svc", "{{ $labels.service_id }}"},
			err:              false,
		},
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(rulesResponse))
	}))
	defer srv.Close()

	for i, row := range tbl {
		out, err := fetchServicesFromRules(&config.ServerConfig{
			Upstream: config.UpstreamType{
				Prometheus: config.UpstreamConfig{
					URL: srv.URL,
				},
			},
			Mapping: config.MappingType{
				AlertConfig: config.AlertMappingType{
					ServiceLabels:      row.inputLabels,
					ServiceAnnotations: row.inputAnnotations,
				},
			},
		})

		if !cmpArr(out, row.output) {
			t.Errorf("[%d] unexpected output: %s, expected %s", i, out, row.output)
		}
		if row.err && err == nil || !row.err && err != nil {
			t.Errorf("[%d] unexpected err: %s, expected %t", i, err, row.err)
		}

	}
}

func TestFetchRules(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(rulesResponse))
	}))
	defer srv.Close()

	rules, err := fetchRules(&config.ServerConfig{
		Upstream: config.UpstreamType{
			Prometheus: config.UpstreamConfig{
				URL: srv.URL,
			},
		},
	})
	if err != nil {
		t.Error(err)
	}

	if len(rules.Data.Groups) != 2 {
		t.Errorf("unexpected number of groups")
	}

	if len(rules.Data.Groups[0].Rules) != 2 {
		t.Errorf("unexpected number of rules")
	}

}

const rulesResponse = `
{
    "status": "success",
    "data": {
        "groups": [
            {
                "name": "Group 1",
                "file": "/etc/prometheus-rules/group-1.rules",
                "rules": [
                    {
                        "name": "MyTestAlert1",
                        "query": "foobar > 0",
                        "duration": 0,
                        "labels": {
                            "severity": "critical",
                            "service_id": "this.svc"
                        },
                        "annotations": {
                            "something": "one"
                        },
                        "alerts": [],
                        "health": "unknown",
                        "type": "alerting"
                    },
                    {
                        "name": "myteam:myservice:5xx:error:budget",
                        "query": "fobar < 0",
                        "health": "unknown",
                        "type": "recording"
                        }
                ],
                "interval": 60
            },
            {
                "name": "group 2",
                "file": "/etc/prometheus-rules/group2.rules",
                "rules": [
                    {
                        "name": "MyTestAlert2",
                        "query": "fart > 42",
                        "duration": 0,
                        "labels": {
                            "severity": "warning",
                            "service_id": "other.svc"

                        },
                        "annotations": {
                            "something": "two"
                        },
                        "alerts": [],
                        "health": "unknown",
                        "type": "alerting"
                    },
                    {
                        "name": "MyTestAlert3",
                        "query": "fart < 42",
                        "duration": 0,
                        "labels": {
                            "severity": "warning",
                            "service_id": "{{ $labels.service_id }}"

                        },
                        "annotations": {},
                        "alerts": [],
                        "health": "unknown",
                        "type": "alerting"
                    }
                ],
                "interval": 60
            }
        ]
    }
}`

func TestFetchLabelValues(t *testing.T) {
	tbl := []struct {
		input  []string
		output []string
		err    bool
	}{
		{
			input:  []string{},
			output: make([]string, 0),
			err:    false,
		},
		{
			input:  []string{""},
			output: make([]string, 0),
			err:    true,
		},
		{
			input:  []string{"foo"},
			output: []string{"foo", "far", "faz", "fang"},
			err:    false,
		},
		{
			input:  []string{"foo", "bar"},
			output: []string{"foo", "far", "faz", "fang", "boo", "bar", "baz", "bang"},
			err:    false,
		},
		{
			input:  []string{"foo", "bar", "nonexistent"},
			output: []string{"foo", "far", "faz", "fang", "boo", "bar", "baz", "bang"},
			err:    true,
		},
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// /api/v1/label/<metric>/values
		split := strings.Split(r.URL.Path, "/")
		rs, ok := serviceLabelMap[split[4]]
		if !ok {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(rs))
	}))
	defer srv.Close()

	for i, row := range tbl {
		out, err := fetchLabelValues(&config.ServerConfig{
			Upstream: config.UpstreamType{
				Prometheus: config.UpstreamConfig{
					URL: srv.URL,
				},
			},
			Mapping: config.MappingType{
				MetricConfig: config.MetricMappingType{
					ServiceLabels: row.input,
				},
			},
		})

		if !cmpArr(out, row.output) {
			t.Errorf("[%d] unexpected output: %s, expected %s", i, out, row.output)
		}
		if row.err && err == nil || !row.err && err != nil {
			t.Errorf("[%d] unexpected err: %s, expected %t", i, err, row.err)
		}

	}
}

func cmpArr(a, b []string) bool {
	for _, va := range a {
		found := false
		for _, vb := range b {
			if vb == va {
				found = true
			}
		}
		if !found {
			return false
		}
	}
	return true
}

var serviceLabelMap = map[string]string{
	"foo": `{"status":"success","data":["foo,far","faz","fang",""]}`,
	"bar": `{"status":"success","data":["boo,bar","baz","bang",""]}`,
}
