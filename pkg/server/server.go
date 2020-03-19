package server

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/moolen/statusgraph/pkg/config"
	"github.com/moolen/statusgraph/pkg/store"
	am "github.com/prometheus/alertmanager/api/v2/models"
)

// Server ..
type Server struct {
	http.Server
	ServerConfig *config.ServerConfig
	DiskStore    *store.DiskStore
}

// New ..
func New(cfg *config.ServerConfig) *Server {
	router := mux.NewRouter()
	s := store.NewDisk("./data")
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	})
	router.HandleFunc("/api/alerts", FetchAlerts(cfg))
	router.HandleFunc("/api/metrics", FetchMetrics(cfg))
	router.HandleFunc("/api/graph", GetGraph(s)).Methods("GET")
	router.PathPrefix("/api/graph/{name}").HandlerFunc(SaveGraph(s)).Methods("POST")

	router.HandleFunc("/api/config/mapping", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(cfg.Mapping)
	})

	spa := staticHandler{staticPath: "./client/dist", indexPath: "index.html"}
	router.PathPrefix("/").Handler(spa)

	return &Server{
		http.Server{
			Handler: handlers.CORS(
				handlers.AllowedOrigins([]string{"*"}))(router),
			Addr:         "0.0.0.0:8000",
			WriteTimeout: 15 * time.Second,
			ReadTimeout:  15 * time.Second,
		},
		cfg,
		s,
	}
}

func filterAlerts(cfg config.AlertMappingType, alerts []am.GettableAlert) ([]am.GettableAlert, error) {
	var out []am.GettableAlert
nextAlert:
	for _, alert := range alerts {
		for _, sel := range cfg.LabelSelector {
			match := true
			for k, v := range sel {
				if alert.Labels[k] != v {
					match = false
				}
			}
			if match {
				out = append(out, alert)
				continue nextAlert
			}
		}
	}
	return out, nil
}
