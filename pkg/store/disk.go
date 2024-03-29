package store

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"
	"sync"
)

type DiskStore struct {
	RootDir string
	mu      *sync.Mutex
}

func NewDisk(dir string) *DiskStore {
	return &DiskStore{
		RootDir: dir,
		mu:      &sync.Mutex{},
	}
}

func (d *DiskStore) Save(key string, data *Stage) error {
	if filepath.Dir(key) != "." {
		return fmt.Errorf("attempted to write outside of data dir")
	}
	fn := path.Join(d.RootDir, key)
	err := os.MkdirAll(filepath.Dir(fn), 0660)
	if err != nil {
		return err
	}
	f, err := os.OpenFile(fn, os.O_RDWR|os.O_TRUNC|os.O_CREATE, 0660)
	if err != nil {
		return err
	}
	storageOps.WithLabelValues("save").Inc()
	return json.NewEncoder(f).Encode(data)
}

func (d *DiskStore) Delete(key string) error {
	p, err := filepath.Abs(key)
	if err != nil {
		return err
	}
	fn := path.Join(d.RootDir, p)
	storageOps.WithLabelValues("delete").Inc()
	return os.Remove(fn)
}

func (d *DiskStore) Load() ([]Stage, error) {
	stages := make([]Stage, 0)
	err := filepath.Walk(d.RootDir,
		func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if info.IsDir() {
				return nil
			}

			data, err := ioutil.ReadFile(path)
			if err != nil {
				return err
			}
			var stage Stage
			err = json.Unmarshal(data, &stage)
			if err != nil {
				return err
			}
			stages = append(stages, stage)
			return nil
		})
	storageOps.WithLabelValues("load").Inc()
	return stages, err
}
