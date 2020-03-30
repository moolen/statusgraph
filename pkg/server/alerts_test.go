package server

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/go-cmp/cmp"
	am "github.com/prometheus/alertmanager/api/v2/models"

	"strings"

	"github.com/moolen/statusgraph/pkg/config"
)

func TestAlerts(t *testing.T) {
	var alertmanagerResponse string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(alertmanagerResponse))
	}))
	defer srv.Close()

	for i, row := range []struct {
		cfg            *config.ServerConfig
		serverResponse string
		expectedStatus int
		expectedBody   string
	}{
		{
			cfg:            &config.ServerConfig{},
			expectedStatus: http.StatusBadGateway,
			expectedBody:   "[]\n",
		},
		{
			cfg: &config.ServerConfig{
				Upstream: config.UpstreamType{
					Alertmanager: config.UpstreamConfig{
						URL: srv.URL,
					},
				},
			},
			expectedStatus: http.StatusBadGateway,
			serverResponse: "xxx\n",
			expectedBody:   "[]\n",
		},
		{
			cfg: &config.ServerConfig{
				Upstream: config.UpstreamType{
					Alertmanager: config.UpstreamConfig{
						URL: srv.URL,
					},
				},
			},
			expectedStatus: 200,
			serverResponse: "[]\n",
			expectedBody:   "[]\n",
		},
		{
			cfg: &config.ServerConfig{
				Upstream: config.UpstreamType{
					Alertmanager: config.UpstreamConfig{
						URL: srv.URL,
					},
				},
				Mapping: config.MappingType{
					AlertConfig: config.AlertMappingType{
						LabelSelector: []config.LabelSelector{
							{
								"severity": "critical",
							},
						},
					},
				},
			},
			expectedStatus: 200,
			serverResponse: `[
				{
					"annotations": {},
					"labels": {
						"service_id": "orders.svc",
						"severity": "critical"
					}
				},
				{
					"annotations": {},
					"labels": {
						"service_id": "orders.svc",
						"severity": "warning"
					}
				}
			]`,
			expectedBody: "[{\"annotations\":{},\"endsAt\":null,\"fingerprint\":null,\"receivers\":null,\"startsAt\":null,\"status\":null,\"updatedAt\":null,\"labels\":{\"service_id\":\"orders.svc\",\"severity\":\"critical\"}}]\n",
		},
	} {
		alertmanagerResponse = row.serverResponse
		res := httptest.NewRecorder()
		FetchAlerts(row.cfg)(res, nil)
		if res.Code != row.expectedStatus {
			t.Errorf("[%d]expected status %d, got: %d", i, row.expectedStatus, res.Code)
		}
		body := res.Body.String()
		if strings.Compare(body, row.expectedBody) != 0 {
			t.Logf("%#v | %#v", body, row.expectedBody)
			t.Errorf("[%d]expected body %s, got: %s", i, row.expectedBody, body)
		}

	}

}

func TestFilterAlerts(t *testing.T) {

	for _, row := range []struct {
		cfg    config.AlertMappingType
		input  []am.GettableAlert
		output []am.GettableAlert
	}{
		{
			cfg: config.AlertMappingType{
				LabelSelector: []config.LabelSelector{
					{
						"select": "foo",
					},
				},
			},
			input: []am.GettableAlert{
				{
					Alert: am.Alert{
						Labels: am.LabelSet{
							"select": "foo",
						},
					},
				},
				{
					Alert: am.Alert{
						Labels: am.LabelSet{
							"select": "xxxxxxxx",
						},
					},
				},
			},
			output: []am.GettableAlert{
				{
					Alert: am.Alert{
						Labels: am.LabelSet{
							"select": "foo",
						},
					},
				},
			},
		},
		{
			cfg: config.AlertMappingType{
				LabelSelector: []config.LabelSelector{
					{
						"select": "foo",
					},
					{
						"select":    "bar",
						"important": "yes",
					},
				},
			},
			input: []am.GettableAlert{
				{
					Alert: am.Alert{
						Labels: am.LabelSet{
							"select": "foo",
						},
					},
				},
				{
					Alert: am.Alert{
						Labels: am.LabelSet{
							"select": "bar",
						},
					},
				},
				{
					Alert: am.Alert{
						Labels: am.LabelSet{
							"select":    "bar",
							"important": "yes",
						},
					},
				},
			},
			output: []am.GettableAlert{
				{
					Alert: am.Alert{
						Labels: am.LabelSet{
							"select": "foo",
						},
					},
				},
				{
					Alert: am.Alert{
						Labels: am.LabelSet{
							"select":    "bar",
							"important": "yes",
						},
					},
				},
			},
		},
	} {
		res, err := filterAlerts(row.cfg, row.input)

		if err != nil {
			t.Fail()
		}

		if !cmp.Equal(res, row.output) {
			t.Errorf("expected %v, got %v", row.output, res)
		}

	}

}
