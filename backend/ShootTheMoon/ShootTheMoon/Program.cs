using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;

using Grpc.Core;
using ShootTheMoon.Network;
using ShootTheMoon.Network.Proto;

namespace ShootTheMoon
{
    public class Program
    {
        const int Port = 30051;
        public static bool Verbose = false;

        public static void Main(string[] args)
        {
            if (args.Length > 0)
                foreach(string arg in args)
                    if (arg.Equals("-v")) Program.Verbose = true;

            Server server = new Server
            {
                Services = { ShootServer.BindService(new ShootServerImpl()) },
                Ports = { new ServerPort("[::]", Port, ServerCredentials.Insecure) }
            };
            server.Start();

            Console.WriteLine("Greeter server listening on port " + Port);

            CreateHostBuilder(args).Build().Run();

            server.ShutdownAsync().Wait();

            System.Console.WriteLine("Server is shut down.");
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}
