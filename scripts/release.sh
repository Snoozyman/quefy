#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_URL="https://github.com/Snoozyman/quefy"

# Get latest tag
get_latest_tag() {
  git describe --tags --abbrev=0 2>/dev/null || echo ""
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

# Get commits since last tag
get_commits_since_tag() {
  local latest_tag="$1"
  if [ -z "$latest_tag" ]; then
    git log --pretty=format:"%H|%h|%s" --reverse
  else
    git log "${latest_tag}..HEAD" --pretty=format:"%H|%h|%s" --reverse
  fi
}

# Generate changelog entry
generate_changelog_entry() {
  local version="$1"
  local date=$(date +%Y-%m-%d)
  local latest_tag="$2"

  local commits=$(get_commits_since_tag "$latest_tag")

  if [ -z "$commits" ]; then
    echo "## [$version] - $date"
    echo
    echo "No changes."
    echo
    return
  fi

  echo "## [$version] - $date"
  echo
  echo "### Commits"
  echo

  while IFS='|' read -r full_hash short_hash message; do
    echo "- [\`${short_hash}\`](${REPO_URL}/commit/${full_hash}) ${message}"
  done <<< "$commits"

  echo
}

# Update CHANGELOG.md
update_changelog() {
  local version="$1"
  local latest_tag="$2"
  local changelog_file="CHANGELOG.md"

  if [ ! -f "$changelog_file" ]; then
    echo -e "${RED}Error: $changelog_file not found${NC}"
    exit 1
  fi

  local new_entry=$(generate_changelog_entry "$version" "$latest_tag")

  # Create temp file with new entry
  local temp_file=$(mktemp)

  # Read header (first 6 lines)
  head -n 6 "$changelog_file" > "$temp_file"

  # Add new entry
  echo "$new_entry" >> "$temp_file"

  # Add rest of file (skip header)
  tail -n +7 "$changelog_file" >> "$temp_file"

  # Replace original
  mv "$temp_file" "$changelog_file"

  echo -e "${GREEN}✓ Updated CHANGELOG.md${NC}"
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
  local current_version
  if [ -z "$latest_tag" ]; then
    current_version="0.0.0"
  else
    current_version=$(parse_version "$latest_tag")
  fi

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
  echo -e "Preparing release: ${GREEN}$new_tag${NC}"
  echo

  # Update CHANGELOG.md
  update_changelog "$new_version" "$latest_tag"

  # Commit changelog
  echo "Committing changelog update..."
  git add CHANGELOG.md
  git commit -m "chore: update changelog for $new_tag"
  echo -e "${GREEN}✓ Changelog committed${NC}"
  echo

  # Create tag
  git tag -a "$new_tag" -m "Release $new_tag"
  echo -e "${GREEN}✓ Tag created: $new_tag${NC}"
  echo

  # Push?
  read -p "Push commit and tag to origin? (Y/n) " -n 1 -r
  echo

  if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo "Pushing..."
    git push origin HEAD
    git push origin "$new_tag"
    echo -e "${GREEN}✓ Pushed successfully${NC}"
    echo
    echo "GitHub Actions will now:"
    echo "  • Run CI (typecheck + test)"
    echo "  • Build and push Docker image: snoozyman/quefy:$new_tag"
  else
    echo "Release created locally. Push with:"
    echo "  git push origin HEAD"
    echo "  git push origin $new_tag"
  fi
}

main "$@"
