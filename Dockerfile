FROM node:24.14.0-bookworm-slim AS frontend-build
WORKDIR /src/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN VITE_API_BASE_URL=/api npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0.401 AS backend-build
WORKDIR /src
COPY global.json ./
COPY server/FlowPilot.Api/FlowPilot.Api.csproj server/FlowPilot.Api/packages.lock.json server/FlowPilot.Api/
RUN dotnet restore server/FlowPilot.Api --locked-mode
COPY server/FlowPilot.Api/ server/FlowPilot.Api/
RUN dotnet publish server/FlowPilot.Api --configuration Release --no-restore \
    --property:UseAppHost=false --output /out/api

FROM backend-build AS migration-build
COPY .config/dotnet-tools.json .config/dotnet-tools.json
RUN dotnet tool restore
# Only design-time configuration: generating the bundle never connects to this host.
RUN ASPNETCORE_ENVIRONMENT=Production \
    ConnectionStrings__Default='Host=unused;Database=unused;Username=unused;Password=unused' \
    dotnet ef migrations bundle --project server/FlowPilot.Api \
    --configuration Release --no-build --output /out/efbundle

FROM mcr.microsoft.com/dotnet/aspnet:10.0.12 AS runtime
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://0.0.0.0:8080
USER $APP_UID

FROM runtime AS migrate
COPY --from=migration-build /out/efbundle ./efbundle
COPY --from=backend-build /out/api/appsettings.json ./appsettings.json
ENTRYPOINT ["./efbundle"]

FROM runtime AS app
COPY --from=backend-build /out/api/ ./
COPY --from=frontend-build /src/client/dist/ ./wwwroot/
EXPOSE 8080
ENTRYPOINT ["dotnet", "FlowPilot.Api.dll"]
