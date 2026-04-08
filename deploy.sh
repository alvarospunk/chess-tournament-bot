#!/bin/bash
set -e

CLUSTER_NAME="telegram-bots"
NAMESPACE="chess-tournament"
IMAGE_NAME="chess-tournament-bot"
IMAGE_TAG="latest"

echo "🔧 Chess Tournament Bot - Deploy to k3d"
echo "========================================="

# 1. Verificar que k3d está instalado
if ! command -v k3d &> /dev/null; then
  echo "❌ k3d no está instalado. Ejecuta: brew install k3d"
  exit 1
fi

# 2. Crear cluster si no existe
if ! k3d cluster list | grep -q "$CLUSTER_NAME"; then
  echo "🚀 Creando cluster k3d '$CLUSTER_NAME'..."
  k3d cluster create --config k3d-config.yaml
else
  echo "✅ Cluster '$CLUSTER_NAME' ya existe"
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

# 6. Aplicar manifiestos de Kubernetes
echo "☸️  Aplicando manifiestos..."
kubectl apply -f k8s/namespace.yaml

# Verificar que el secret existe
if ! kubectl get secret chess-tournament-bot-secret -n "$NAMESPACE" &> /dev/null; then
  if [ -f k8s/secret.yaml ]; then
    kubectl apply -f k8s/secret.yaml
  else
    echo ""
    echo "⚠️  No se encontró k8s/secret.yaml"
    echo "   Crea el secret manualmente:"
    echo "   cp k8s/secret.yaml.example k8s/secret.yaml"
    echo "   Edita k8s/secret.yaml con tu token en base64:"
    echo "   echo -n 'TU_TOKEN' | base64"
    echo ""
    exit 1
  fi
fi

kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/deployment.yaml

# 7. Esperar a que el pod esté listo
echo "⏳ Esperando a que el bot arranque..."
kubectl rollout status deployment/chess-tournament-bot -n "$NAMESPACE" --timeout=60s

echo ""
echo "✅ ¡Bot desplegado correctamente!"
echo ""
echo "📋 Comandos útiles:"
echo "   kubectl logs -f deployment/chess-tournament-bot -n $NAMESPACE    # Ver logs"
echo "   kubectl get pods -n $NAMESPACE                                   # Ver pods"
echo "   kubectl rollout restart deployment/chess-tournament-bot -n $NAMESPACE  # Reiniciar"
