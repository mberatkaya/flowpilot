#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"

output_dir="$repo_dir/artifacts/production"
# A fresh package must never retain obsolete frontend assets from a previous build.
if [[ -d "$output_dir" ]]; then
  rm -rf -- "$output_dir"
fi

npm --prefix client ci
VITE_API_BASE_URL=/api npm --prefix client run build
dotnet restore FlowPilot.slnx --locked-mode
dotnet publish server/FlowPilot.Api --configuration Release --no-restore \
  --property:UseAppHost=false --output "$output_dir"
mkdir -p "$output_dir/wwwroot"
cp -R client/dist/. "$output_dir/wwwroot/"

dotnet tool restore
# Script generation does not connect to a database; no production secret is needed.
ConnectionStrings__Default='Host=unused;Database=unused;Username=unused;Password=unused' \
  dotnet ef migrations script --idempotent --configuration Release --no-build \
  --project server/FlowPilot.Api --output "$output_dir/migrations.sql"

printf 'Production package: %s\n' "$output_dir"
