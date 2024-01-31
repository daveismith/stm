import React, { useEffect, useState } from "react";
import { Grid } from "@material-ui/core";
import { useGame } from "../../Game/Game.context";
import PlayingCard from "../../Common/PlayingCard";
import TextBubble from "../../Common/TextBubble"
import { Card } from "../Models/Card";
import { Seat } from "../Models/Seat";
import { Bid } from "../Models/Bid";
import PlayArea from "./PlayArea";

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

interface IPendingCard {
    card: Card;
    index: number;
    operation: string;
}

const GameBoard: React.FC<IGameBoardProps> = (props: IGameBoardProps) => {
    const [ gameState ] = useGame();

    const [pendingCards, setPendingCards] = useState<IPendingCard[]>([]);

    const { playCard, transferCard, throwAwayCard, throwingAway, validToPlay, leadCard, winningBid } = gameState;

    const { hand, seats, mySeat, currentBidder, currentSeat, transferTarget, playedCards, highBid, bids, bidTricksSelected, bidTrumpSelected } = props;

    const orderedSeats = Array.from(seats.values()).sort((s1,s2) => s1.index - s2.index);

    const currentPlayer = (currentSeat === mySeat) || (transferTarget !== undefined) || throwingAway;

    React.useEffect(() => {
        if (pendingCards.length > 0) {
            const timeout = setTimeout(() => {
                let pending = pendingCards[0];
                if ('play' === pending.operation) {
                    playCard(pending.card, pending.index);
                }
            }, 500);

            return () => clearTimeout(timeout);
        } else {
            return () => {}
        }
    }, [pendingCards]);

    useEffect(() => {
        console.log('hand updated');
        setPendingCards([]);
    }, [hand])

    const playedCard = (index: number) => {
        const playedCard = playedCards.get(index);
        return playedCard && <PlayingCard card={playedCard}></PlayingCard>;
    }

    const bid = (index: number) => {
        const bid = bids.get(index);
        return bid && <div>{bid.number} {Bid.trumpString(bid.trump)}</div>;
    }

    const onCardClick = (card: Card, index: number) => {
        if (!currentPlayer) {
            return; // not our turn
        }

        if (transferTarget !== undefined) {
            // Transfer Card
            console.log('transfer card');
            //setCardToRemove(index);
            transferCard(mySeat, transferTarget, card, index);
        } else if (throwingAway) {            
            console.log('throw away card')
            //setCardToRemove(index);
            throwAwayCard(card, index);
        } else {
            // Need to figure out how to animate here.
            setPendingCards([{card: card, index: index, operation: 'play'}]);
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
            <PlayArea />
            {(transferTarget !== undefined && pendingCards.length == 0)? <div style={{bottom: '10em', left: 0, right: '25%', position: 'absolute', justifyContent: 'center'}}>Transfer A Card</div> : <></>}
            {(throwingAway && pendingCards.length == 0)? <div style={{bottom: '10em', left: 0, right: '25%', position: 'absolute', justifyContent: 'center'}}>Throw Away A Card</div> : <></>}
            {(currentPlayer && winningBid !== null && pendingCards.length == 0) ? <div style={{bottom: '10em', left: 0, right: '25%', position: 'absolute', justifyContent: 'center'}}>Play A Card</div> : <></>}
            <div style={{bottom: 0, left: 0, right: '25%', position: 'absolute', display: 'flex', justifyContent: 'center', marginBottom: '2em', marginTop: '2em'}}>
                {
                    hand.map((card, index) => {
                            let remove = false;
                            for (var i = 0; i < pendingCards.length; i++) {
                                //console.log('card: ' + card);
                                if (pendingCards[i].card === card && pendingCards[i].index == index) {
                                    remove = true;
                                }
                            }
                            return <PlayingCard
                                key={"playing_card_" + index} 
                                card={card} 
                                clickable={currentPlayer && !currentBidder && pendingCards.length === 0}
                                illegal={!validToPlay(card, leadCard, hand, winningBid?.trump)}
                                remove={remove}
                                onClick={() => onCardClick(card, index)}
                            />})
                }
            </div>
        </div>
    );
};

export default GameBoard;
