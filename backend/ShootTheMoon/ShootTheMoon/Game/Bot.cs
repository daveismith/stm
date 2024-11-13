using Grpc.Core;
using ShootTheMoon.Network.Proto;

namespace ShootTheMoon.Game
{
    public class Bot : Client
    {
        private ShootServer.ShootServerClient _grpcClient;

        public AsyncServerStreamingCall<Notification> NotificationStream  { get; set; }

        public Bot(ShootServer.ShootServerClient grpcClient) {
            _grpcClient = grpcClient;
        }
    }
}