
namespace ShootTheMoon.Game
{
    abstract class DeckFactory 
    {

        /// <summary>
        /// Builds a new deck and returns a fresh deck.
        /// </summary>
        /// <param name="numDuplicateCards">The number of duplicates copies of cards in the deck</param>
        /// <param name="shuffle">Indicates if the deck should be shuffled</param>
        public abstract Deck BuildDeck(int numDuplicateCards = 1, bool shuffle = true);

    }

}