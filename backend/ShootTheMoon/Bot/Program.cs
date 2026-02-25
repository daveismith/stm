// See https://aka.ms/new-console-template for more information
using Bot;
class BotMaker
{
    static async Task Main(string[] args)
    {
        Bot.Bot bot = new Bot.Bot(BotProfile.DEFAULT);

        bot.JoinGame(args[0]);

        await bot.GetNotifications();
    }
}
