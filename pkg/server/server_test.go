package server

import (
	"io/ioutil"

	log "github.com/sirupsen/logrus"
)

func init() {
	log.SetOutput(ioutil.Discard)
}
