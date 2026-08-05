using System.Threading.Tasks;

using Grpc.Core;
using ShootTheMoon.Bot.Proto;
using Serilog;
using System.Collections.Generic;
using System;
using ShootTheMoon.Utils;
using Grpc.Net.Client;
using ShootTheMoon.Network.Proto;

namespace ShootTheMoon.Network
{
    public interface IBotRegistry
    {
        
        Task<bool> RequestBotsForGame(string gameUuid, string profileName, uint numBots);

    }

    public class BotRegistryImpl : BotRegistry.BotRegistryBase, IBotRegistry
    {
        class BotInfo
        {
            private static readonly ILogger Log = Serilog.Log.ForContext<BotInfo>();

            private BotServer.BotServerClient BotServerClient = null;
            private Task StatusTask = null;

            public string Endpoint { get; }
            public string BotVersion { get; }

            public string BotId { get; private set; } = "";

            public uint MaxBots { get; private set; } = 1;

            public uint ActiveBots { get; private set; } = 0;

            public List<string> BotProfiles { get; } = new List<string>();

            public DateTime LastStatusUpdate { get; private set; } = DateTime.MinValue;

            public TimeSpan TimeSinceLastStatusUpdate => DateTime.UtcNow - LastStatusUpdate;

            public BotInfo(string endpoint, string botVersion, TimeSpan botTimeout)
            {
                Endpoint = endpoint;
                BotVersion = botVersion;
                BotId = IdGenerator.NewId();
                LastStatusUpdate = DateTime.UtcNow;

                StatusTask = Task.Run(async () =>
                {
                    using var channel = GrpcChannel.ForAddress(endpoint);
                    BotServerClient = new BotServer.BotServerClient(channel);
                                        
                    try
                    {
                        var StatusRequest = new BotStatusRequest
                        {
                            BotId = BotId,
                            Ttl = (uint)botTimeout.TotalSeconds
                        };
                        using var StatusStream = BotServerClient.Status(StatusRequest);

                        await foreach (var statusUpdate in StatusStream.ResponseStream.ReadAllAsync())
                        {
                            Log.Information("Received status update from bot: " + statusUpdate.BotId);
                            
                            LastStatusUpdate = DateTime.UtcNow;
                            BotId = statusUpdate.BotId;
                            MaxBots = statusUpdate.MaxBots;
                            ActiveBots = statusUpdate.ActiveBots;
                            BotProfiles.Clear();
                            BotProfiles.AddRange(statusUpdate.BotProfiles);
                        }
                    }
                    catch (Grpc.Core.RpcException rpcEx) when (rpcEx.StatusCode == Grpc.Core.StatusCode.Unavailable)
                    {
                        Log.Warning("Bot at endpoint " + endpoint + " is unavailable. It has likely gone offline. Marking for Removal");
                        MaxBots = 0; // Mark the bot as unavailable by setting MaxBots to 0, which will trigger its removal in the next cleanup cycle
                        ActiveBots = 0;
                        BotProfiles.Clear();
                        LastStatusUpdate = DateTime.MinValue; // Reset the last status update time to ensure it gets removed in the next cleanup cycle
                        //TODO: Notify Any Games Using This Bot That It Has Gone Offline So They Can Handle It Gracefully (e.g. End The Game, Remove The Bot From The Game, etc.)
                    }
                    catch (Exception ex)
                    {
                        Log.Error(ex, "Error while receiving status updates from bot");
                    }
                });
            }

            // Add a function to set the bot up to trigger the addition of bots
            public async Task<bool> RequestBotsForGame(string gameUuid, string profileName, uint numBots)
            {
                var addRequest = new AddBotsToGameRequest
                {
                    Uuid = gameUuid,
                    ProfileName = profileName,
                    BotsRequested = numBots
                };

                Log.Information("Requesting " + numBots + " bots for game " + gameUuid + " with profile " + profileName);

                var response = await BotServerClient.AddBotsToGameAsync(addRequest);
                if (response.Status == ResponseStatus.Ok)
                {
                    Log.Information("Bot at endpoint " + Endpoint + " accepted the request to add bots to game " + gameUuid);
                    return true;
                }
                else
                {
                    Log.Warning("Bot at endpoint " + Endpoint + " rejected the request to add bots to game " + gameUuid);
                    return false;
                }
            }
        }
        List<BotInfo> Bots { get; } = new List<BotInfo>();
        TimeSpan BotTimeout = TimeSpan.FromSeconds(30); // Example timeout duration

        public BotRegistryImpl()
        {
            Task.Run(async () =>
                {
                    while(true)
                    {
                        Log.Information("Tick");
                        RemoveInactiveBots();
                        await Task.Delay(BotTimeout).ConfigureAwait(false);
                    }
                });
        }

        public override Task<BotRegisterResponse> RegisterBot(BotRegisterRequest request, ServerCallContext context)
        {
            //TODO: store the bot information into a queue which will the be processed and connect
            // to the bot server. For now, just log the information and return OK.
            // In reality, we will probably create a new object which can be used to pass data between the bot
            // registry and the ShootServerImpl

            Log.Information("Registering bot with EP: " + request.Endpoint + " and version: " + request.BotVersion);

            var botInfo = new BotInfo(request.Endpoint, request.BotVersion, BotTimeout);
            Bots.Add(botInfo);  // Register the bot information for later use

            return Task.FromResult(new BotRegisterResponse { Status = ResponseStatus.Ok });
        }

        public async Task<bool> RequestBotsForGame(string gameUuid, string profileName, uint numBots)
        {
            Log.Information("Requesting " + numBots + " bots for game " + gameUuid + " with profile " + profileName);

            List<BotInfo> availableBots = Bots.FindAll(bot => (bot.MaxBots - bot.ActiveBots) >= numBots);
            Log.Information("Found " + availableBots.Count + " available bots for profile " + profileName);

            if (availableBots.Count == 0)
            {
                Log.Warning("No available bots found for game " + gameUuid + " with profile " + profileName);
                return false;
            } else
            {
                BotInfo selectedBot = availableBots[0]; // For now, just select the first available bot. We can implement more complex selection logic later if needed (e.g. load balancing, profile matching, etc.)
                Log.Information("Selected bot at endpoint " + selectedBot.Endpoint + " to add bots to game " + gameUuid);
                bool result = await selectedBot.RequestBotsForGame(gameUuid, profileName, numBots);
                if (result)
                {
                    Log.Information("Successfully requested bot at endpoint " + selectedBot.Endpoint + " to add bots to game " + gameUuid);
                }
                else
                {
                    Log.Warning("Failed to request bot at endpoint " + selectedBot.Endpoint + " to add bots to game " + gameUuid);
                }
                return result;
            }
        }

        public void RemoveInactiveBots()
        {
            Log.Information("Checking for inactive bots. Current count: " + Bots.Count);
            List<BotInfo> removedBots = Bots.FindAll(bot => bot.TimeSinceLastStatusUpdate > BotTimeout);
            //TODO: Show The List Of Removed Bots In The Logs For Debugging
            Bots.RemoveAll(bot => bot.TimeSinceLastStatusUpdate > BotTimeout);
            Log.Information("Removed inactive bots. Count: " + removedBots.Count);
        }

    }
}
