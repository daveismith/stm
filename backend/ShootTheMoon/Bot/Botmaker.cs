using Bot;
class BotMaker
{
    private static readonly int NUM_BOTS = 8;

    private int Port { get; set; }

    private Queue<Bot.Bot> FreeBots = new Queue<Bot.Bot>();

    private Queue<Bot.Bot> BusyBots = new Queue<Bot.Bot>();

    public BotMaker(int port)
    {
        Port = port;

        for (int i = 0; i < NUM_BOTS; i++)
        {
            FreeBots.Enqueue(new Bot.Bot(BotProfile.DEFAULT));
        }

        RegisterBotmaker();
    }

    private void RegisterBotmaker()
    {
        
    }

    public async Task<bool> ActivateBot(string game_uuid)
    {
        Bot.Bot bot;

        if (FreeBots.Count > 0)
        {
            bot = FreeBots.Dequeue();

            BusyBots.Enqueue(bot);
        
            bot.JoinGame(game_uuid);

            await bot.GetNotifications();

            return true;
        }

        return false;
    }

    public async void DeactivateBot(string bot_uuid)
    {
        
    }
}