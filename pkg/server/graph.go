package server

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/moolen/statusgraph/pkg/store"
	log "github.com/sirupsen/logrus"
)

func GetGraph(s store.DataStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stages, err := s.Load()
		if err != nil {
			log.Error(err)
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]bool{"ok": true})
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(stages)
		return
	}
}

func SaveGraph(s store.DataStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		defer r.Body.Close()
		var cfg store.Stage
		err := json.NewDecoder(r.Body).Decode(&cfg)
		if err != nil {
			log.Error(err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]bool{"ok": false})
			return
		}
		cfg.Name = vars["name"]
		log.Infof("decoded payload: %#v", cfg)
		err = s.Save(vars["name"], &cfg)
		if err != nil {
			log.Error(err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]bool{"ok": false})
			return
		}
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	}
}
