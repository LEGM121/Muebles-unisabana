FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY InventoryService.Api/InventoryService.Api.csproj InventoryService.Api/

RUN dotnet restore InventoryService.Api/InventoryService.Api.csproj

COPY . .

RUN dotnet publish InventoryService.Api/InventoryService.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "InventoryService.Api.dll"]
