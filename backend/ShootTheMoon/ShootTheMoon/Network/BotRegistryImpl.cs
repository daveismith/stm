using System.Threading.Tasks;

using Grpc.Core;
using ShootTheMoon.Bot.Proto;
using Serilog;
using System.Collections.Generic;
using System;
using ShootTheMoon.Game;
using Grpc.Net.Client;

namespace ShootTheMoon.Network
{
    public class BotRegistryImpl : BotRegistry.BotRegistryBase
    {
        class BotInfo
        {
            private static readonly ILogger Log = Serilog.Log.ForContext<BotInfo>();

            private BotServer.BotServerClient BotServerClient = null;
            private AsyncServerStreamingCall<BotStatusUpdate> StatusStream = null;
            private Task StatusTask = null;

            public string Endpoint { get; }
            public string BotVersion { get; }

            public string BotId { get; private set; } = "";

            public uint MaxBots { get; private set; } = 1;

            public uint ActiveBots { get; private set; } = 0;

            public List<string> BotProfiles { get; } = new List<string>();

            public DateTime LastStatusUpdate { get; private set; } = DateTime.MinValue;

            public TimeSpan TimeSinceLastStatusUpdate => DateTime.UtcNow - LastStatusUpdate;

            public BotInfo(string endpoint, string botVersion)
            {
                Endpoint = endpoint;
                BotVersion = botVersion;
                using var channel = GrpcChannel.ForAddress(endpoint);
                BotServerClient = new BotServer.BotServerClient(channel);

                StatusStream = BotServerClient.Status(new BotStatusRequest());

                StatusTask = Task.Run(async () =>
                {
                    try
                    {
                        while (await StatusStream.ResponseStream.MoveNext())
                        {
                            var statusUpdate = StatusStream.ResponseStream.Current;
                            Log.Information("Received status update from bot: " + statusUpdate.BotId);
                            
                            LastStatusUpdate = DateTime.UtcNow;
                            BotId = statusUpdate.BotId;
                            MaxBots = statusUpdate.MaxBots;
                            ActiveBots = statusUpdate.ActiveBots;
                            BotProfiles.Clear();
                            BotProfiles.AddRange(statusUpdate.BotProfiles);
                        }
                    }
                    catch (Exception ex)
                    {
                        Log.Error(ex, "Error while receiving status updates from bot");
                    }
                });
            }

            // Add a function to set the bot up to trigger the addition of bots
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

            var botInfo = new BotInfo(request.Endpoint, request.BotVersion);
            Bots.Add(botInfo);  // Register the bot information for later use

            return Task.FromResult(new BotRegisterResponse { Status = ResponseStatus.Ok });
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