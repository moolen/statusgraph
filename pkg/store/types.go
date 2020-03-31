package store

import (
	"github.com/google/uuid"
)

type Stage struct {
	ID    uuid.UUID `json:"id"`
	Name  string    `json:"name"`
	Edges []Edge    `json:"edges"`
	Nodes []Node    `json:"nodes"`
}

type Edge struct {
	ID     uuid.UUID  `json:"id"`
	Source EdgeTarget `json:"source"`
	Target EdgeTarget `json:"target"`
	Type   string     `json:"type"`
}

type EdgeTarget struct {
	ID        uuid.UUID `json:"id"`
	Type      string    `json:"type"`
	Connector string    `json:"connector"`
}

type Node struct {
	ID        string          `json:"id"`
	Name      string          `json:"name"`
	Namespace string          `json:"namespace"`
	Type      string          `json:"type"`
	Labels    []string        `json:"labels"`
	Connector []NodeConnector `json:"connector"`
	Children  []string        `json:"children"`
	Bounds    NodeBounds      `json:"bounds"`
}

type NodeConnector struct {
	ID    uuid.UUID `json:"id"`
	Name  string    `json:"name"`
	Label string    `json:"label"`
}

type NodeBounds struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type DataStore interface {
	Save(key string, data *Stage) error
	Delete(key string) error
	Load() ([]Stage, error)
}
