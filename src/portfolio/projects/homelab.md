# homelab

My personal infrastructure playground.

Stack:    k3s, ArgoCD, Prometheus, Grafana, Loki
Deploy:   GitOps (this site is one of its tenants)
Source:   https://github.com/<your-handle>/homelab

## Highlights
- Single-node cluster running on a $5 VPS
- Cert-manager + Let's Encrypt for wildcard TLS
- Everything reconciled from git — push to deploy
