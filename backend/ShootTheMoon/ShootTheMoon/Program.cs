using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Grpc.Core;
using My.Sample.Namespace;

namespace ShootTheMoon
{

    class ShootServerImpl : ShootServer.ShootServerBase
    {

        public override async Task JoinGame(JoinGameRequest request, IServerStreamWriter<Notification> responseStream, ServerCallContext context)
        {
            var rng = new Random();
            var now = DateTime.UtcNow;

            var i = 0;
            while (!context.CancellationToken.IsCancellationRequested && i < 20)
            {
                await Task.Delay(500); // Gotta look busy


                StatusResponse r = new StatusResponse();
                r.Success = true;
                r.ErrorNum = 0;
                r.ErrorText = "";

                Notification n = new Notification();
                n.Status = r;

                await responseStream.WriteAsync(n);                
            }
        }

    }

    public class Program
    {
        const int Port = 30051;

        public static void Main(string[] args)
        {

            Server server = new Server
            {
                Services = { ShootServer.BindService(new ShootServerImpl()) },
                Ports = { new ServerPort("localhost", Port, ServerCredentials.Insecure) }
            };
            server.Start();

            Console.WriteLine("Greeter server listening on port " + Port);

            CreateHostBuilder(args).Build().Run();

            server.ShutdownAsync().Wait();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}
