package store

import (
	"sync"
)

type MemStore struct {
	mu   *sync.Mutex
	data map[string]*Stage
}

func NewMemory() *MemStore {
	return &MemStore{
		mu: &sync.Mutex{},
	}
}

func (d *MemStore) Save(key string, data *Stage) error {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.data[key] = data
	return nil
}

func (d *MemStore) Delete(key string) error {
	d.mu.Lock()
	defer d.mu.Unlock()
	delete(d.data, key)
	return nil
}

func (d *MemStore) Load() ([]Stage, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	stages := make([]Stage, 0)
	for _, stage := range d.data {
		stages = append(stages, *stage)
	}
	return stages, nil
}

func (d *MemStore) Reset() {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.data = make(map[string]*Stage)
}
