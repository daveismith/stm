
namespace ShootTheMoon.Game
{

    class RandomDeckFactory : DeckFactory 
    {

        public override Deck BuildDeck(int numDuplicateCards = 1, bool shuffle = true)
        {
            return new Deck(numDuplicateCards, shuffle);
        }

    }

}