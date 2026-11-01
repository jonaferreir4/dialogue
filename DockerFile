# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files for caching dependency restores
COPY ["src/Domain/Domain.csproj", "Domain/"]
COPY ["src/Application/Application.csproj", "Application/"]
COPY ["src/Infraestructure/Infraestructure.csproj", "Infraestructure/"]
COPY ["src/WebApi/WebApi.csproj", "WebApi/"]

RUN dotnet restore "WebApi/WebApi.csproj"

# Copy source code and publish in Release mode
COPY src/ ./
WORKDIR /src/WebApi
RUN dotnet publish -c Release -o /app/out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "WebApi.dll"]