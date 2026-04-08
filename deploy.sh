#!/bin/bash
# deploy.sh — Construye la imagen del bot y la despliega en el cluster telegram-bots.
#
# Requisitos previos:
#   - El cluster k3d 'telegram-bots' y la infra base (LocalStack + ESO) deben estar
#     corriendo. Si es la primera vez, levántalos desde el repo k8s-home-cluster:
#       git clone https://github.com/alvarospunk/k8s-home-cluster.git
#       cd k8s-home-cluster && ./bootstrap.sh
#
#   - El secret del bot debe existir en LocalStack:
#       aws --endpoint-url=http://localhost:4566 secretsmanager create-secret \
#           --name chess-tournament-bot/telegram-token \
#           --secret-string '{"TELEGRAM_BOT_TOKEN":"TU_TOKEN"}'

set -e

CLUSTER_NAME="telegram-bots"
NAMESPACE="chess-tournament"
IMAGE_NAME="chess-tournament-bot"
IMAGE_TAG="latest"

echo "🔧 Chess Tournament Bot - Deploy to k3d"
echo "========================================="

# 1. Verificar dependencias
for cmd in k3d kubectl docker; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "❌ '$cmd' no está instalado. Ejecuta: brew install $cmd"
    exit 1
  fi
done

# 2. Verificar que el cluster existe
if ! k3d cluster list | grep -q "$CLUSTER_NAME"; then
  echo "❌ Cluster '$CLUSTER_NAME' no encontrado."
  echo "   Levanta la infra base primero:"
  echo "   cd ../k8s-home-cluster && ./bootstrap.sh"
  exit 1
fi

# 3. Apuntar kubectl al cluster
echo "🔗 Configurando kubectl..."
kubectl config use-context "k3d-${CLUSTER_NAME}"

# 4. Construir imagen Docker
echo "🐳 Construyendo imagen Docker..."
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

# 5. Importar imagen al cluster k3d
echo "📦 Importando imagen al cluster..."
k3d image import "${IMAGE_NAME}:${IMAGE_TAG}" -c "$CLUSTER_NAME"

# 6. Aplicar manifiestos del bot
echo "☸️  Aplicando manifiestos..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/external-secret.yaml  # SecretStore + ExternalSecret → crea el Secret via ESO
kubectl apply -f k8s/deployment.yaml

# 7. Esperar a que el pod esté listo
echo "⏳ Esperando a que el bot arranque..."
kubectl rollout status deployment/chess-tournament-bot -n "$NAMESPACE" --timeout=60s

echo ""
echo "✅ ¡Bot desplegado correctamente!"
echo ""
echo "📋 Comandos útiles:"
echo "   kubectl logs -f deployment/chess-tournament-bot -n $NAMESPACE"
echo "   kubectl get pods -n $NAMESPACE"
echo "   kubectl get externalsecret -n $NAMESPACE"
echo "   kubectl rollout restart deployment/chess-tournament-bot -n $NAMESPACE"
