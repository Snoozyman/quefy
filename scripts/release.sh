#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get latest tag
get_latest_tag() {
  git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0"
}

# Parse version components
parse_version() {
  local tag="$1"
  local version="${tag#v}"
  echo "$version"
}

# Bump version
bump_version() {
  local current="$1"
  local type="$2"

  IFS='.' read -r major minor patch <<< "$current"

  case "$type" in
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    patch)
      patch=$((patch + 1))
      ;;
    *)
      echo -e "${RED}Invalid bump type: $type${NC}"
      exit 1
      ;;
  esac

  echo "$major.$minor.$patch"
}

# Check for uncommitted changes
check_clean() {
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Aborted."
      exit 1
    fi
  fi
}

# Main
main() {
  echo -e "${BLUE}Quefy Release Script${NC}"
  echo "===================="
  echo

  # Check if we're in a git repo
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not a git repository${NC}"
    exit 1
  fi

  # Check for uncommitted changes
  check_clean

  # Get current version
  local latest_tag=$(get_latest_tag)
  local current_version=$(parse_version "$latest_tag")

  echo -e "Current version: ${GREEN}$current_version${NC}"
  echo

  # Show bump options
  local major=$(bump_version "$current_version" "major")
  local minor=$(bump_version "$current_version" "minor")
  local patch=$(bump_version "$current_version" "patch")

  echo "Choose bump type:"
  echo "  1) major  → v$major (breaking changes)"
  echo "  2) minor  → v$minor (new features)"
  echo "  3) patch  → v$patch (bug fixes)"
  echo

  read -p "Select [1-3]: " choice

  local new_version
  case "$choice" in
    1) new_version="$major" ;;
    2) new_version="$minor" ;;
    3) new_version="$patch" ;;
    *)
      echo -e "${RED}Invalid choice${NC}"
      exit 1
      ;;
  esac

  local new_tag="v$new_version"

  echo
  echo -e "Creating tag: ${GREEN}$new_tag${NC}"

  # Optional: add release notes
  read -p "Add release notes? (y/N) " -n 1 -r
  echo

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Enter release notes (Ctrl+D when done):"
    local notes=$(cat)
    git tag -a "$new_tag" -m "Release $new_tag" -m "$notes"
  else
    git tag -a "$new_tag" -m "Release $new_tag"
  fi

  echo -e "${GREEN}✓ Tag created: $new_tag${NC}"
  echo

  # Push?
  read -p "Push tag to origin? (Y/n) " -n 1 -r
  echo

  if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo "Pushing tag..."
    git push origin "$new_tag"
    echo -e "${GREEN}✓ Tag pushed successfully${NC}"
    echo
    echo "GitHub Actions will now:"
    echo "  • Run CI (typecheck + test)"
    echo "  • Build and push Docker image: snoozyman/quefy:$new_tag"
  else
    echo "Tag created locally. Push with:"
    echo "  git push origin $new_tag"
  fi
}

main "$@"
