#!/usr/bin/env bash
# =============================================================================
# Abmiti Flutter App — Setup & Build Script
# =============================================================================
# Usage:
#   ./build.sh setup      → Install dependencies + generate icons & splash
#   ./build.sh debug      → Build debug APK
#   ./build.sh release    → Build release APK
#   ./build.sh analyze    → Run flutter analyze
#   ./build.sh clean      → Clean build artifacts
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ─── Colour output ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC} $*"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ─── Prerequisite checks ──────────────────────────────────────────────────────
check_prerequisites() {
    info "Checking prerequisites..."

    if ! command -v flutter &>/dev/null; then
        error "Flutter not found. Install Flutter 3.44.4-stable and ensure it's in PATH."
        exit 1
    fi

    local flutter_version
    flutter_version=$(flutter --version 2>&1 | head -1)
    info "Flutter: $flutter_version"

    if ! command -v java &>/dev/null; then
        error "Java not found. Install OpenJDK 21."
        exit 1
    fi

    local java_version
    java_version=$(java -version 2>&1 | head -1)
    info "Java: $java_version"

    # Create local.properties if missing
    if [[ ! -f "android/local.properties" ]]; then
        local flutter_sdk
        flutter_sdk=$(which flutter | xargs -I{} dirname {} | xargs -I{} dirname {})
        local android_home="${ANDROID_HOME:-${HOME}/Android/Sdk}"

        info "Creating android/local.properties..."
        cat > android/local.properties <<EOF
sdk.dir=${android_home}
flutter.sdk=${flutter_sdk}
flutter.buildMode=debug
flutter.versionName=1.0.0
flutter.versionCode=1
EOF
        info "local.properties created. Verify sdk.dir and flutter.sdk paths."
    fi
}

# ─── Commands ─────────────────────────────────────────────────────────────────
cmd_setup() {
    check_prerequisites
    info "Installing Flutter dependencies..."
    flutter pub get

    info "Generating native splash screen..."
    dart run flutter_native_splash:create

    info "Generating app icons..."
    dart run flutter_launcher_icons

    info "Running flutter analyze..."
    flutter analyze

    info "✅ Setup complete! Run './build.sh debug' to build the debug APK."
}

cmd_debug() {
    check_prerequisites
    info "Building debug APK..."
    flutter build apk --debug --verbose
    info "✅ Debug APK: build/app/outputs/flutter-apk/app-debug.apk"
}

cmd_release() {
    check_prerequisites
    info "Building release APK..."
    flutter build apk --release
    info "✅ Release APK: build/app/outputs/flutter-apk/app-release.apk"
}

cmd_analyze() {
    flutter analyze
}

cmd_clean() {
    info "Cleaning build artifacts..."
    flutter clean
    info "✅ Clean complete."
}

# ─── Entry point ──────────────────────────────────────────────────────────────
case "${1:-help}" in
    setup)   cmd_setup ;;
    debug)   cmd_debug ;;
    release) cmd_release ;;
    analyze) cmd_analyze ;;
    clean)   cmd_clean ;;
    *)
        echo "Usage: $0 {setup|debug|release|analyze|clean}"
        exit 1
        ;;
esac
