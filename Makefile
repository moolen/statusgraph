IMAGE_REPO = quay.io/moolen/statusgraph
IMG ?= ${IMAGE_REPO}:${version}
HUGO=bin/hugo

.PHONY: binary
binary: bin
	go build -o bin/statusgraph ./main.go

.PHONY: client
client:
	cd client/ && npm install && npm run build:prod

.PHONY: test
test:
	go test -v -cover ./...

bin:
	mkdir bin

docker-build:
	docker build . -t ${IMG}

docker-push:
	docker push ${IMG}

docker-push-latest:
	docker tag ${IMG} ${IMAGE_REPO}:latest
	docker push ${IMAGE_REPO}:latest

docker-release: docker-build docker-push docker-push-latest

release: docker-release

.PHONY: docs
docs: bin/hugo
	cd docs_src; ../$(HUGO) --theme book --destination ../docs

docs-live: bin/hugo
	cd docs_src; ../$(HUGO) server --minify --theme book


bin/hugo:
	curl -sL https://github.com/gohugoio/hugo/releases/download/v0.69.0/hugo_extended_0.69.0_Linux-64bit.tar.gz | tar -xz -C /tmp/
	mkdir bin; cp /tmp/hugo bin/hugo
