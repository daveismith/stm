using ShootTheMoon.Bot.Proto;
using Grpc.Core;
using Grpc.Net.Client;
using ShootTheMoon.Network.Proto;

namespace ShootTheMoon.Bot
{
    class BotServerImpl : BotServer.BotServerBase
    {
        private static readonly int NUM_BOTS = 8;

        private Queue<Bot> FreeBots = new Queue<Bot>();

        private Dictionary<string, Bot> BusyBots = new Dictionary<string, Bot>();

        private BotRegistry.BotRegistryClient? _grpcClient;
        
        private Metadata _grpcMetadata = new Metadata();

        public BotServerImpl()
        {
            Bot bot;
            for (int i = 0; i < NUM_BOTS; i++)
            {
                bot = new Bot(BotProfile.DEFAULT);
                FreeBots.Enqueue(bot);
            }

            RegisterBotserver();
        }

        private void RegisterBotserver()
        {
            GrpcChannel channel = GrpcChannel.ForAddress("http://localhost:8080");
            BotRegistry.BotRegistryClient grpcClient = new BotRegistry.BotRegistryClient(channel);
            _grpcClient = grpcClient;

            BotRegisterRequest botRegisterRequest = new BotRegisterRequest();
            botRegisterRequest.BotVersion = "1.0";
            botRegisterRequest.Endpoint = "";

            Console.WriteLine($"botRegisterRequest: {botRegisterRequest}");

            BotRegisterResponse botRegisterResponse = _grpcClient.RegisterBot(botRegisterRequest, _grpcMetadata);
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