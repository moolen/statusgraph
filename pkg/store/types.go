package store

type Stage struct {
	Name  string `json:"name"`
	Edges []Edge `json:"edges"`
	Nodes []Node `json:"nodes"`
}

type Edge struct {
	Source string `json:"source"`
	Target string `json:"target"`
	Type   string `json:"type"`
}
type Node struct {
	ID        string   `json:"id"`
	ServiceID string   `json:"service_id"`
	Title     string   `json:"title"`
	Type      string   `json:"type"`
	SubType   string   `json:"sub_type"`
	Children  []string `json:"children"`
	X         float64  `json:"x"`
	Y         float64  `json:"y"`
}

type DataStore interface {
	Save(key string, data *Stage) error
	Load() ([]Stage, error)
}
