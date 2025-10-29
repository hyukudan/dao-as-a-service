#!/bin/bash

# DAO-as-a-Service Development Setup Script
# ==========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "======================================"
    echo "$1"
    echo "======================================"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_success "Docker is installed"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_success "Created .env file"
        print_warning "Please update .env file with your configuration"
    else
        print_success ".env file found"
    fi
}

# Start services
start_services() {
    print_header "Starting Docker services"
    docker-compose up -d
    print_success "Docker services started"
}

# Stop services
stop_services() {
    print_header "Stopping Docker services"
    docker-compose down
    print_success "Docker services stopped"
}

# Show logs
show_logs() {
    docker-compose logs -f "$1"
}

# Run database migrations
run_migrations() {
    print_header "Running database migrations"
    docker-compose exec backend npx prisma db push
    print_success "Database migrations completed"
}

# Deploy contracts to local Hardhat node
deploy_contracts() {
    print_header "Deploying contracts to local Hardhat node"

    # Wait for Hardhat node to be ready
    echo "Waiting for Hardhat node..."
    sleep 5

    docker-compose exec hardhat npx hardhat run scripts/deploy.js --network localhost
    print_success "Contracts deployed"
    print_warning "Update FACTORY_ADDRESS in .env with the deployed address"
}

# Run tests
run_tests() {
    print_header "Running tests"

    if [ "$1" == "contracts" ]; then
        docker-compose exec hardhat npm test
    elif [ "$1" == "backend" ]; then
        docker-compose exec backend npm test
    elif [ "$1" == "frontend" ]; then
        docker-compose exec frontend npm test
    else
        print_error "Invalid test target. Use: contracts, backend, or frontend"
    fi
}

# Health check
health_check() {
    print_header "Health Check"

    echo "Checking services..."
    echo ""

    # Check Hardhat node
    if curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545 &> /dev/null; then
        print_success "Hardhat node is running on port 8545"
    else
        print_error "Hardhat node is not responding"
    fi

    # Check Backend
    if curl -s http://localhost:3001/health &> /dev/null; then
        print_success "Backend is running on port 3001"
    else
        print_error "Backend is not responding"
    fi

    # Check Frontend
    if curl -s http://localhost:3000 &> /dev/null; then
        print_success "Frontend is running on port 3000"
    else
        print_error "Frontend is not responding"
    fi

    # Check PostgreSQL
    if docker-compose exec -T postgres pg_isready -U dao_user &> /dev/null; then
        print_success "PostgreSQL is running"
    else
        print_error "PostgreSQL is not responding"
    fi

    # Check Redis
    if docker-compose exec -T redis redis-cli ping &> /dev/null; then
        print_success "Redis is running"
    else
        print_error "Redis is not responding"
    fi
}

# Clean everything
clean() {
    print_header "Cleaning up"
    print_warning "This will remove all containers, volumes, and data!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        print_success "Cleanup completed"
    else
        print_warning "Cleanup cancelled"
    fi
}

# Show usage
usage() {
    echo "DAO-as-a-Service Development Script"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start        - Start all services"
    echo "  stop         - Stop all services"
    echo "  restart      - Restart all services"
    echo "  logs [name]  - Show logs (optional: specify service name)"
    echo "  migrate      - Run database migrations"
    echo "  deploy       - Deploy contracts to local Hardhat node"
    echo "  test [name]  - Run tests (contracts, backend, or frontend)"
    echo "  health       - Check health of all services"
    echo "  clean        - Remove all containers and volumes"
    echo "  help         - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh start"
    echo "  ./dev.sh logs backend"
    echo "  ./dev.sh test contracts"
}

# Main script
main() {
    case "$1" in
        start)
            check_docker
            check_env
            start_services
            sleep 10
            run_migrations
            health_check
            echo ""
            print_success "Development environment is ready!"
            echo ""
            echo "Services:"
            echo "  - Frontend:  http://localhost:3000"
            echo "  - Backend:   http://localhost:3001"
            echo "  - Hardhat:   http://localhost:8545"
            echo "  - Postgres:  localhost:5432"
            echo "  - Redis:     localhost:6379"
            echo ""
            echo "Run './dev.sh deploy' to deploy contracts to local Hardhat node"
            echo "Run './dev.sh logs' to view logs"
            ;;
        stop)
            stop_services
            ;;
        restart)
            stop_services
            start_services
            ;;
        logs)
            show_logs "$2"
            ;;
        migrate)
            run_migrations
            ;;
        deploy)
            deploy_contracts
            ;;
        test)
            run_tests "$2"
            ;;
        health)
            health_check
            ;;
        clean)
            clean
            ;;
        help|*)
            usage
            ;;
    esac
}

# Run main function
main "$@"
