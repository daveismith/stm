// See https://aka.ms/new-console-template for more information
using Bot;

Console.WriteLine("Hello, World!");

Bot.Bot bot = new Bot.Bot(BotProfile.DEFAULT);

bot.JoinGame("second-hand_revolution");

await bot.GetNotifications();