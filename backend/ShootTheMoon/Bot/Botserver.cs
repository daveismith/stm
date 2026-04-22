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

        private static readonly uint NUM_BOTS = 8;

        private static readonly bool DOCKER_BOT_REGISTRY = false;

        private Queue<Bot> FreeBots = new Queue<Bot>();

        private Dictionary<string, Bot> BusyBots = new Dictionary<string, Bot>();

        private BotRegistry.BotRegistryClient? _grpcClient;
        
        private Metadata _grpcMetadata = new Metadata();

        public BotServerImpl()
        {
            Bot bot;
            for (uint i = 0; i < NUM_BOTS; i++)
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
            string botRegistryURL;

            if (DOCKER_BOT_REGISTRY)
            {
                botRegistryURL = "http://shoot-backend:30052";
            }
            else
            {
                botRegistryURL= "http://localhost:30052";
            }

            GrpcChannel channel = GrpcChannel.ForAddress(botRegistryURL);
            BotRegistry.BotRegistryClient grpcClient = new BotRegistry.BotRegistryClient(channel);
            _grpcClient = grpcClient;

            BotRegisterRequest botRegisterRequest = new BotRegisterRequest();
            botRegisterRequest.BotVersion = "1.0";
            botRegisterRequest.Endpoint = "http://localhost:30053";

            Console.WriteLine($"botRegisterRequest: {botRegisterRequest}");

            BotRegisterResponse botRegisterResponse = _grpcClient.RegisterBot(botRegisterRequest, _grpcMetadata);

            Console.WriteLine($"botRegisterResponse: {botRegisterResponse}");
        }

        public override async Task Status(BotStatusRequest request, IServerStreamWriter<BotStatusUpdate> responseStream, ServerCallContext context)
        {
            string botId = request.BotId;
            int ttl = (int)((request.Ttl / 2) * 1000); // Convert to ms and divide by 2 to get the period for status updates (we want to send updates at half the TTL)

            Console.WriteLine("Received status update for bot: " + request.BotId + ", TTL: " + request.Ttl + " seconds, selected TTL of " + ttl + " ms");

            while (!context.CancellationToken.IsCancellationRequested)
            {
                BotStatusUpdate botStatusUpdate = new BotStatusUpdate();
                botStatusUpdate.BotId = botId;
                botStatusUpdate.MaxBots = NUM_BOTS;
                botStatusUpdate.ActiveBots = (uint)(NUM_BOTS - FreeBots.Count);

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