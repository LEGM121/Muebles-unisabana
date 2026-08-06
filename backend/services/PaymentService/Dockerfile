FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY PaymentService.Api/PaymentService.Api.csproj PaymentService.Api/

RUN dotnet restore PaymentService.Api/PaymentService.Api.csproj

COPY . .

RUN dotnet publish PaymentService.Api/PaymentService.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "PaymentService.Api.dll"]
