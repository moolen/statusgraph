package server

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"strings"

	"github.com/google/go-cmp/cmp"
	"github.com/google/uuid"
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
			expectedBody:   "[{\"id\":\"00000000-0000-0000-0000-000000000000\",\"name\":\"bar\",\"edges\":[],\"nodes\":[]},{\"id\":\"00000000-0000-0000-0000-000000000000\",\"name\":\"bar\",\"edges\":[],\"nodes\":[]}]\n",
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
			req:  httptest.NewRequest("GET", "http://foo.example", bytes.NewBufferString(`{"name":"fart","edges":[{"source": {"id":"1029ade5-2373-4766-b51e-b905dfe300a9", "type":"rect"}}],"nodes":[]}\n`)),
			expectedData: []store.Stage{
				{
					Name: "fart",
					ID:   uuid.Nil,
					Edges: []store.Edge{{
						ID: uuid.Nil,
						Source: store.EdgeTarget{
							ID:   uuid.MustParse("1029ade5-2373-4766-b51e-b905dfe300a9"),
							Type: "rect",
						},
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
		SaveStage(s)(res, row.req)
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

func TestDeleteGraph(t *testing.T) {
	s := store.NewMemory()
	for _, row := range []struct {
		cfg            *config.ServerConfig
		name           string
		req            *http.Request
		initialData    map[string]store.Stage
		expectedData   []store.Stage
		expectedStatus int
		expectedBody   string
	}{
		{
			cfg:  &config.ServerConfig{},
			name: "9381acab-2373-4766-b51e-0005dfe30000",
			req:  httptest.NewRequest("GET", "http://foo.example", nil),
			initialData: map[string]store.Stage{
				"9381acab-2373-4766-b51e-0005dfe30000": {
					Name:  "fart",
					ID:    uuid.MustParse("9381acab-2373-4766-b51e-0005dfe30000"),
					Edges: make([]store.Edge, 0),
					Nodes: make([]store.Node, 0),
				},
			},
			expectedData:   []store.Stage{},
			expectedStatus: http.StatusOK,
			expectedBody:   "{\"ok\":true}\n",
		},
		{
			// should not delete existing things
			cfg:  &config.ServerConfig{},
			name: "NONEXISTENT",
			req:  httptest.NewRequest("GET", "http://foo.example", nil),
			initialData: map[string]store.Stage{
				"9381acab-2373-4766-b51e-0005dfe30000": {
					Name:  "fart",
					ID:    uuid.MustParse("9381acab-2373-4766-b51e-0005dfe30000"),
					Edges: make([]store.Edge, 0),
					Nodes: make([]store.Node, 0),
				},
			},
			expectedData: []store.Stage{
				{
					Name:  "fart",
					ID:    uuid.MustParse("9381acab-2373-4766-b51e-0005dfe30000"),
					Edges: make([]store.Edge, 0),
					Nodes: make([]store.Node, 0),
				},
			},
			expectedStatus: http.StatusOK,
			expectedBody:   "{\"ok\":true}\n",
		},
	} {
		res := httptest.NewRecorder()
		s.Reset()

		for k, d := range row.initialData {
			s.Save(k, &d)
		}

		row.req = mux.SetURLVars(row.req, map[string]string{
			"id": row.name,
		})
		DeleteStage(s)(res, row.req)
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
