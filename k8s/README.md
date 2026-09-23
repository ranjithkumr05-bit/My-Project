# Kubernetes / EKS notes (compatible-by-construction, not cluster-tested)

No cluster was available here (no `kubectl`, no Docker daemon), so these
manifests are syntactically validated only (`node --check`-style review +
`npm run smoke` for the image payload). They follow stateless best practice:

- Probes hit `GET /api/health` (JSON, Accept-independent) — never the SPA fallback.
- `ConfigMap` carries `PORT/HOST/DATA_DIR/PERSIST`; secrets (`WHATSAPP_NUMBER`,
  `WEBHOOK_URL`, auth hashes) belong in a `Secret`, not in git.
- Stateless: sample-data store is in memory (`PERSIST=0` default). Set `PERSIST=1`
  only with a `PersistentVolumeClaim` mounted at `/app/data`.
- Single container serves API + static `frontend/dist` (no sidecar needed).
  Browsers get `index.html` at `/`; API clients keep JSON via content negotiation.

Apply:

```sh
docker build -t customwear:latest .
docker push <registry>/customwear:latest   # update image: in deployment.yaml
kubectl apply -f k8s/configmap.yaml -f k8s/deployment.yaml -f k8s/service.yaml
kubectl rollout status deployment/customwear
```

EKS/Fargate: same manifests apply; front with an ALB Ingress for TLS and
set `image:` to ECR. No EBS needed unless `PERSIST=1`.
