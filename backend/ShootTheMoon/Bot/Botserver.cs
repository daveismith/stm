using ShootTheMoon.Bot.Proto;
using Grpc.Core;
using Grpc.Net.Client;
using ShootTheMoon.Network.Proto;
using Serilog;


namespace ShootTheMoon.Bot
{
    class BotServerImpl : BotServer.BotServerBase
    {

        private static readonly ILogger Log = Serilog.Log.ForContext<BotServerImpl>();

        public static uint NumBots { get; private set; } = 8;

        private Queue<Bot> FreeBots = new Queue<Bot>();

        private Dictionary<string, Bot> BusyBots = new Dictionary<string, Bot>();

        private BotRegistry.BotRegistryClient? _grpcClient;
        
        private Metadata _grpcMetadata = new Metadata();

        public BotServerImpl()
        {
            string numBotsEnv = Environment.GetEnvironmentVariable("NUM_BOTS") ?? "8";
            if (!uint.TryParse(numBotsEnv, out uint NumBots))
            {
                NumBots = 8;
            }

            Bot bot;
            for (uint i = 0; i < NumBots; i++)
            {
                bot = new Bot(BotProfile.DEFAULT);
                FreeBots.Enqueue(bot);
            }

            Task.Run(async () => {
                await Task.Delay(1000);
                RegisterBotserver();
            });
        }

        private void RegisterBotserver()
        {
            string botRegistryURL = Environment.GetEnvironmentVariable("BOT_REGISTRY_URL") ?? "http://localhost:30052";
            string hostName = System.Net.Dns.GetHostName();

            Log.Information("Registering bot server with bot registry at " + botRegistryURL);
            Log.Information("Host Name is " + hostName);

            GrpcChannel channel = GrpcChannel.ForAddress(botRegistryURL);
            BotRegistry.BotRegistryClient grpcClient = new BotRegistry.BotRegistryClient(channel);
            _grpcClient = grpcClient;

            BotRegisterRequest botRegisterRequest = new BotRegisterRequest();
            botRegisterRequest.BotVersion = "1.0";
            botRegisterRequest.Endpoint = $"http://{hostName}:30053";

            Log.Debug($"botRegisterRequest: {botRegisterRequest}");

            BotRegisterResponse botRegisterResponse = _grpcClient.RegisterBot(botRegisterRequest, _grpcMetadata);

            Log.Debug($"botRegisterResponse: {botRegisterResponse}");
        }

        public override async Task<AddBotsToGameResponse> AddBotsToGame(AddBotsToGameRequest request, ServerCallContext context)
        {
            //TODO: Handle This
            Log.Information("Received request to add bots to game " + request.Uuid + " with profile: " + request.ProfileName + ", num bots: " + request.BotsRequested);

            for (uint i = 0; i < request.BotsRequested; i++)
            {
                if (FreeBots.Count > 0)
                {
                    await ActivateBot(request.Uuid);
                }
                else
                {
                    Log.Warning("No free bots available to add to game " + request.Uuid);
                }
            }


            return new AddBotsToGameResponse
            {
                Status = ResponseStatus.Ok
            };
        }


        public override async Task Status(BotStatusRequest request, IServerStreamWriter<BotStatusUpdate> responseStream, ServerCallContext context)
        {
            string botId = request.BotId;
            int ttl = (int)((request.Ttl / 2) * 1000); // Convert to ms and divide by 2 to get the period for status updates (we want to send updates at half the TTL)

            Log.Debug("Received status update for bot: " + request.BotId + ", TTL: " + request.Ttl + " seconds, selected TTL of " + ttl + " ms");

            while (!context.CancellationToken.IsCancellationRequested)
            {
                BotStatusUpdate botStatusUpdate = new BotStatusUpdate();
                botStatusUpdate.BotId = botId;
                botStatusUpdate.MaxBots = NumBots;
                botStatusUpdate.ActiveBots = (uint)(NumBots - FreeBots.Count);

                await responseStream.WriteAsync(botStatusUpdate);

                await Task.Delay(ttl);
            }
        }

        public async Task<bool> ActivateBot(string game_uuid)
        {
            Bot bot;

            if (FreeBots.Count > 0)
            {
                bot = FreeBots.Dequeue();

                BusyBots.Add(bot.Bot_uuid, bot);
            
                bot.JoinGame(game_uuid);

                await bot.GetNotifications();

                return true;
            }

            return false;
        }

        public async void DeactivateBot(string bot_uuid)
        {
            Bot bot = BusyBots[bot_uuid];
            BusyBots.Remove(bot_uuid);
            FreeBots.Enqueue(bot);
        }
    }
}
