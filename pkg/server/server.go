package server

import (
	"encoding/json"
	"net/http"
	"time"

	prommw "github.com/albertogviana/prometheus-middleware"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/moolen/statusgraph/pkg/config"
	"github.com/moolen/statusgraph/pkg/store"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Server ..
type Server struct {
	http.Server
	ServerConfig *config.ServerConfig
	DiskStore    *store.DiskStore
}

// New ..
func New(cfg *config.ServerConfig, staticDir, dataDir string) *Server {
	router := mux.NewRouter()
	s := store.NewDisk(dataDir)
	mw := prommw.NewPrometheusMiddleware(prommw.Opts{})
	router.Use(mw.InstrumentHandlerDuration)
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	})
	router.HandleFunc("/api/alerts", FetchAlerts(cfg))
	router.HandleFunc("/api/metrics", FetchMetrics(cfg))
	router.HandleFunc("/api/services", FetchAvailableServices(cfg))

	router.HandleFunc("/api/graph", GetGraph(s)).Methods("GET")
	router.PathPrefix("/api/graph/{id}").HandlerFunc(SaveStage(s)).Methods("POST")
	router.PathPrefix("/api/graph/{id}").HandlerFunc(DeleteStage(s)).Methods("DELETE")
	router.PathPrefix("/api/graph").HandlerFunc(CreateStage(s)).Methods("POST")

	router.Handle("/metrics", promhttp.Handler())

	router.HandleFunc("/api/config/mapping", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(cfg.Mapping)
	})

	spa := staticHandler{staticPath: staticDir, indexPath: "index.html"}
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
