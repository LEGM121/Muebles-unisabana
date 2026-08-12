FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY CatalogService.Api/CatalogService.Api.csproj CatalogService.Api/
COPY CatalogService.Application/CatalogService.Application.csproj CatalogService.Application/
COPY CatalogService.Domain/CatalogService.Domain.csproj CatalogService.Domain/

RUN dotnet restore CatalogService.Api/CatalogService.Api.csproj

COPY . .

RUN dotnet publish CatalogService.Api/CatalogService.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_USE_POLLING_FILE_WATCHER=1

EXPOSE 8080

ENTRYPOINT ["dotnet", "CatalogService.Api.dll"]
