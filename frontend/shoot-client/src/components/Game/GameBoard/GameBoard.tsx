import React from "react";
import { Grid } from "@material-ui/core";
import { useGame } from "../../Game/Game.context";
import PlayingCard from "../../Common/PlayingCard";
import TextBubble from "../../Common/TextBubble"
import { Card } from "../Models/Card";
import { Seat } from "../Models/Seat";
import { Bid } from "../Models/Bid";
import Bidding from "./Bidding";

interface IGameBoardProps {
    hand: Card[];
    seats: Map<number, Seat>;
    mySeat: number;
    currentSeat: number;
    transferTarget: number;
    playedCards: Map<number, Card>;
    highBid: Bid | null;
    bids: Map<number, Bid>;
    currentBidder: boolean;
    bidTricksSelected: string | null;
    bidTrumpSelected: string | null;
}

const GameBoard: React.FC<IGameBoardProps> = (props: IGameBoardProps) => {
    const [ gameState ] = useGame();

    const { playCard, transferCard, throwawayCard, throwingAway } = gameState;

    const { hand, seats, mySeat, currentBidder, currentSeat, transferTarget, playedCards, highBid, bids, bidTricksSelected, bidTrumpSelected  } = props;

    const orderedSeats = Array.from(seats.values()).sort((s1,s2) => s1.index - s2.index);

    const currentPlayer = (currentSeat === mySeat) || (transferTarget !== undefined) || throwingAway;

    console.log('transferTarget: ' + transferTarget + ', throwingAway: ' + throwingAway);

    const playedCard = (index: number) => {
        const playedCard = playedCards.get(index);
        return playedCard && <PlayingCard card={playedCard}></PlayingCard>;
    }

    const bid = (index: number) => {
        const bid = bids.get(index);
        return bid && <div>{bid.number} {Bid.trumpString(bid.trump)}</div>;
    }

    const onCardClick = (card: Card, index: number) => {
        if (transferTarget !== undefined) {
            // Transfer Card
            console.log('transfer card');
            transferCard(mySeat, transferTarget, card, index);
        } else if (throwingAway) {            
            console.log('throw away card')
            throwawayCard(card, index);
        } else {
            playCard(card, index);
        }
    }

    return (
        <div style={{color: 'white', backgroundColor: '#404040', height: '100%', paddingTop: '1rem'}}>
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="flex-start"
            >
                {orderedSeats.map((seat, index) => (
                <Grid
                    item
                    direction="column"
                    justify="center"
                    alignItems="flex-start"
                    key={index}
                >
                    
                    <TextBubble size="small" text={seat.name.length === 0 ? "Empty" : seat.name + ((seat.index === mySeat) ? " (me)" : "")} color={seat.index % 2 === 0 ? "green" : "blue"} disabled={seat.empty}></TextBubble><br />
                    { (seat.index === currentSeat) ? '✮' : null}
                    {bid(seat.index)}
                    {playedCard(seat.index)}
                </Grid>
                ))}
            </Grid>
            <Bidding highBid={highBid} bids={bids} bidTricksSelected={bidTricksSelected} bidTrumpSelected={bidTrumpSelected} />
            {(transferTarget !== undefined)? <div style={{bottom: '10em', left: 0, right: '25%', position: 'absolute', justifyContent: 'center'}}>Transfer A Card</div> : <></>}
            {(throwingAway)? <div style={{bottom: '10em', left: 0, right: '25%', position: 'absolute', justifyContent: 'center'}}>Throw Away A Card</div> : <></>}
            <div style={{bottom: 0, left: 0, right: '25%', position: 'absolute', display: 'flex', justifyContent: 'center', marginBottom: '2em', marginTop: '2em'}}>
                {
                    hand.map((card, index) => (
                        <PlayingCard
                            key={"playing_card_" + index} 
                            card={card} 
                            clickable={currentPlayer && !currentBidder}
                            onClick={() => onCardClick(card, index)}
                        />)
                    )
                }
            </div>
        </div>
    );
};

export default GameBoard;
