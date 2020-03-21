package server

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"strings"

	"github.com/google/go-cmp/cmp"
	"github.com/gorilla/mux"

	"github.com/moolen/statusgraph/pkg/config"
	"github.com/moolen/statusgraph/pkg/store"
)

func TestGetGraph(t *testing.T) {
	s := store.NewMemory()
	for _, row := range []struct {
		cfg            *config.ServerConfig
		data           []store.Stage
		expectedStatus int
		expectedBody   string
	}{
		{
			cfg: &config.ServerConfig{},
			data: []store.Stage{
				{
					Name:  "foo",
					Edges: make([]store.Edge, 0),
					Nodes: make([]store.Node, 0),
				},
				{
					Name:  "bar",
					Edges: make([]store.Edge, 0),
					Nodes: make([]store.Node, 0),
				},
			},
			expectedStatus: http.StatusOK,
			expectedBody:   "[{\"name\":\"bar\",\"edges\":[],\"nodes\":[]},{\"name\":\"bar\",\"edges\":[],\"nodes\":[]}]\n",
		},
	} {
		res := httptest.NewRecorder()
		s.Reset()
		for _, stage := range row.data {
			s.Save(stage.Name, &stage)
		}
		GetGraph(s)(res, nil)
		if res.Code != row.expectedStatus {
			t.Errorf("expected status %d, got: %d", row.expectedStatus, res.Code)
		}
		body := res.Body.String()
		if strings.Compare(body, row.expectedBody) != 0 {
			t.Logf("%#v | %#v", body, row.expectedBody)
			t.Errorf("expected body %s, got: %s", row.expectedBody, body)
		}

	}
}

func TestSaveGraph(t *testing.T) {
	s := store.NewMemory()
	for _, row := range []struct {
		cfg            *config.ServerConfig
		name           string
		req            *http.Request
		expectedData   []store.Stage
		expectedStatus int
		expectedBody   string
	}{
		{
			cfg:  &config.ServerConfig{},
			name: "fart",
			req:  httptest.NewRequest("GET", "http://foo.example", bytes.NewBufferString(`{"name":"----","edges":[{"source":"example"}],"nodes":[]}\n`)),
			expectedData: []store.Stage{
				{
					Name: "fart",
					Edges: []store.Edge{{
						Source: "example",
					}},
					Nodes: make([]store.Node, 0),
				},
			},
			expectedStatus: http.StatusOK,
			expectedBody:   "{\"ok\":true}\n",
		},
		{
			cfg:            &config.ServerConfig{},
			name:           "fart",
			req:            httptest.NewRequest("GET", "http://foo.example", bytes.NewBufferString(`xxxx`)),
			expectedData:   []store.Stage{},
			expectedStatus: http.StatusBadRequest,
			expectedBody:   "{\"ok\":false}\n",
		},
	} {
		res := httptest.NewRecorder()
		s.Reset()
		row.req = mux.SetURLVars(row.req, map[string]string{
			"name": row.name,
		})
		SaveGraph(s)(res, row.req)
		if res.Code != row.expectedStatus {
			t.Errorf("expected status %d, got: %d", row.expectedStatus, res.Code)
		}
		body := res.Body.String()
		if strings.Compare(body, row.expectedBody) != 0 {
			t.Logf("%#v | %#v", body, row.expectedBody)
			t.Errorf("expected body %s, got: %s", row.expectedBody, body)
		}

		d, err := s.Load()
		if err != nil {
			t.Fail()
		}
		if !cmp.Equal(d, row.expectedData) {
			t.Errorf("expected store data %#v, got: %#v", row.expectedData, d)
		}

	}
}
