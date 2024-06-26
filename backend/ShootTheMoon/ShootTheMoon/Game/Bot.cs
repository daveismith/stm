using ShootTheMoon.Network.Proto;

namespace ShootTheMoon.Game
{
    public class Bot : Client
    {
        private ShootServer.ShootServerClient _grpcClient;

        public Bot(ShootServer.ShootServerClient grpcClient) {
            _grpcClient = grpcClient;
        }
    }
}