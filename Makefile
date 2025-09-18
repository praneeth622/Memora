# Memora AI Chat - Docker Management Makefile

.PHONY: help build up down logs clean dev prod test health

# Default target
help: ## Show this help message
	@echo "Memora AI Chat - Docker Commands"
	@echo "================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Environment setup
setup: ## Copy environment template and show setup instructions
	@if [ ! -f .env ]; then \
		cp .env.template .env; \
		echo "✅ Created .env file from template"; \
		echo "⚠️  Please edit .env with your actual API keys before running"; \
	else \
		echo "⚠️  .env file already exists"; \
	fi

# Development commands
dev: setup ## Start development environment with hot reload
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-detached: setup ## Start development environment in background
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

# Production commands
build: ## Build all Docker images
	docker-compose build

up: setup build ## Start production environment
	docker-compose up

prod: setup build ## Start production environment in background
	docker-compose up -d

# Management commands
down: ## Stop all services
	docker-compose down

stop: ## Stop all services (alias for down)
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-frontend: ## Show frontend logs only
	docker-compose logs -f frontend

logs-backend: ## Show backend logs only
	docker-compose logs -f backend-token-server backend-agent

# Health and testing
health: ## Check health of all services
	@echo "Checking service health..."
	@curl -s http://localhost:3000/api/health | python -m json.tool || echo "❌ Frontend unhealthy"
	@curl -s http://localhost:3003/health | python -m json.tool || echo "❌ Token Server unhealthy"

test: ## Run basic connectivity tests
	@echo "Testing service connectivity..."
	@echo "Frontend: $$(curl -s -o /dev/null -w "%%{http_code}" http://localhost:3000/api/health)"
	@echo "Token Server: $$(curl -s -o /dev/null -w "%%{http_code}" http://localhost:3003/health)"

# Cleanup commands
clean: ## Remove all containers and volumes
	docker-compose down -v --remove-orphans

clean-all: ## Remove containers, volumes, and images
	docker-compose down -v --remove-orphans --rmi all

prune: ## Clean up unused Docker resources
	docker system prune -f
	docker volume prune -f

# Utility commands
shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

shell-backend: ## Open shell in backend container
	docker-compose exec backend-token-server sh

shell-agent: ## Open shell in agent container
	docker-compose exec backend-agent sh

# Status commands
ps: ## Show running containers
	docker-compose ps

stats: ## Show container resource usage
	docker stats

# Quick commands
quick-start: setup build prod health ## Complete setup: build, start, and check health
	@echo "🚀 Memora AI Chat is running!"
	@echo "📱 Frontend: http://localhost:3000"
	@echo "🔧 Token Server: http://localhost:3003"

quick-dev: setup dev-detached ## Quick development start
	@echo "🛠️  Development environment started!"
	@echo "📱 Frontend: http://localhost:3000 (with hot reload)"