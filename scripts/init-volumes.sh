#!/bin/bash

# Criar diretórios necessários para volumes do Docker
mkdir -p tmp/mongodb
mkdir -p tmp/prometheus
mkdir -p tmp/grafana

# Definir permissões para que os containers possam escrever
chmod 777 tmp/prometheus
chmod 777 tmp/grafana

echo "✓ Diretórios criados e permissões configuradas"
echo "✓ Pronto para executar: docker compose up -d"
