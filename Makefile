IMAGE_REPO = quay.io/moolen/statusgraph
IMG ?= ${IMAGE_REPO}:${version}

.PHONY: binary
binary: bin
	go build -o bin/statusgraph ./main.go

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
