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
using ShootTheMoon.Game;

namespace ShootTheMoon
{

    class ShootServerImpl : ShootServer.ShootServerBase
    {

        class RpcClient {

            public IServerStreamWriter<Notification> Stream { get; }

            public Client Client { get; }

            public Game.Game Game { get; }

            public RpcClient(IServerStreamWriter<Notification> stream, Client client, Game.Game game) {
                Stream = stream;
                Client = client;
                Game  = game;
            }

        }

        Dictionary<string, Game.Game> games = new Dictionary<string, Game.Game>();
        Dictionary<string, RpcClient> clients = new Dictionary<string, RpcClient>();

        public override async Task JoinGame(JoinGameRequest request, IServerStreamWriter<Notification> responseStream, ServerCallContext context)
        {
            Game.Game game;

            try {
                game = games[request.Uuid];
            } catch (KeyNotFoundException) {
                // The game key doesn't exist, so try to add the game
                game = new Game.Game(GameSettings.GamePresets["SIXPLAYER"]);
                games.Add(request.Uuid, game);  //TODO: Change This To Handle The Generated UUIDS (this should be a failure case normally)
            }

            context.UserState.Add("gameId", request.Uuid);

            Client c = new Client();
            game.Clients.Add(c);
            clients.Add(c.Token, new RpcClient(responseStream, c, game));

            // Send A Join Game Response
            JoinGameResponse jgr = new JoinGameResponse();
            jgr.Token = c.Token;

            Notification n = new Notification();
            n.JoinResponse = jgr;

            await responseStream.WriteAsync(n);                
        
            try {
                await Task.Delay(-1, context.CancellationToken);
            } catch (TaskCanceledException) {
                // Task Cancelled, Do Any Disconnection Stuff
                clients.Remove(c.Token);
                game.Clients.Remove(c);
            }

        }
      
        private async void SendSeatsList(Game.Game game) {
            SeatsList sl = new SeatsList();
            for (int i = 0; i < game.NumPlayers; i++) {
                Client c = game.Clients[i];
                SeatDetails details = new SeatDetails();
                details.Seat = (uint)i;
                details.Ready = false;
                details.Empty = (c == null);
                details.Human = (c == null) ? false : c.Human;
                details.Name = "Player " + i.ToString();
                sl.Seats.Add(details);
            }

            Notification n = new Notification();
            n.SeatList = sl;

            foreach (Client c in game.Clients) {
                try {
                    RpcClient rpcClient = clients[c.Token];
                    await rpcClient.Stream.WriteAsync(n);
                } catch (KeyNotFoundException) {
                }
            }
        }

        public override Task<StatusResponse> TakeSeat(TakeSeatRequest request, ServerCallContext context)
        {
            string uuid = context.RequestHeaders.GetValue("x-game-id");
            string clientToken = context.RequestHeaders.GetValue("x-game-token");
            
            StatusResponse r = new StatusResponse();
            Game.Game game;

            try {
                game = games[uuid];
            } catch (KeyNotFoundException) {
                r.Success = false;
                r.ErrorNum = 1; // TODO: Error Enum
                r.ErrorText = "Game Not Found";
                return Task.FromResult(r);
            }

            // Try To Take The Seat Request
            Client seatClient = game.Players[request.Seat];
            if (seatClient != null) {
                r.Success = false;
                r.ErrorNum = 2; // TODO: Error Enum
                r.ErrorText = "Seat In Use";
                return Task.FromResult(r);
            } else {
                RpcClient client = clients[clientToken];
                game.Players[request.Seat] = client.Client;
            }

            r.Success = true;
            r.ErrorNum = 0;
            r.ErrorText = "";

            SendSeatsList(game);

            return Task.FromResult(r);
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
