using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using System;

using Grpc.Core;
using ShootTheMoon.Network;
using ShootTheMoon.Network.Proto;
using Serilog;
using Microsoft.Extensions.Configuration;
using System.IO;
using ShootTheMoon.Bot.Proto;

namespace ShootTheMoon
{
    public class Program
    {
        const int Port = 30051;

        public static void Main(string[] args)
        {
            var configuration = new ConfigurationBuilder()
                .AddEnvironmentVariables()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", true)
                .Build();

            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(configuration)
                .CreateLogger();

            try
            {
                //TODO: The Bot Server Needs To Be Protected So That Only Local
                // Bots Can Connect To It. For Now, Just Bind To Localhost.
                Server botServer = new Server
                {
                    Services = { BotRegistry.BindService(new BotRegistryImpl()) },
                    Ports = { new ServerPort("[::]", Port + 1, ServerCredentials.Insecure) }
                };
                botServer.Start();

                Server server = new Server
                {
                    Services = { ShootServer.BindService(new ShootServerImpl()) },
                    Ports = { new ServerPort("[::]", Port, ServerCredentials.Insecure) }
                };
                server.Start();

                Log.Information("Game Server listening on port " + Port);

                CreateHostBuilder(args).Build().Run();

                server.ShutdownAsync().Wait();
                botServer.ShutdownAsync().Wait();

                Log.Information("Server is shut down.");
            }
            catch(Exception e)
            {
                Log.Fatal(e, "Host terminated unexpectedly");
            }
            finally
            {
                Log.CloseAndFlush();
            }  
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                })
                .UseSerilog();
    }
}
