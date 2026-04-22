#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:6.0-bullseye-slim AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443
EXPOSE 30053

FROM mcr.microsoft.com/dotnet/sdk:6.0-bullseye-slim AS build
WORKDIR /src
COPY ["Bot/Bot.csproj", "Bot/"]
COPY ["ShootTheMoon/ShootTheMoon.csproj", "ShootTheMoon/"]
RUN dotnet restore "Bot/Bot.csproj"
COPY . .
WORKDIR "/src/Bot"
RUN dotnet build "Bot.csproj" -c Debug -o /app/build

FROM build AS publish
RUN dotnet publish "Bot.csproj" -c Debug -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Bot.dll"]
