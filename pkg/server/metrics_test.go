package server

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/moolen/statusgraph/pkg/config"
)

func TestFetchMetrics(t *testing.T) {
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
                            "service_id": "orders.svc"
                        },
                        "annotations": {
                            "dashboard": "example.com"
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
                            "service_id": "orders.svc"

                        },
                        "annotations": {},
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
