import React from "react";
import { Grid } from "@material-ui/core";
import PlayingCard from "../../Common/PlayingCard";
import TextBubble from "../../Common/TextBubble"
import { Card } from "../Models/Card";
import { Seat } from "../Models/Seat";
import { Bid } from "../Models/Bid";

interface IGameBoardProps {
    hand: Card[],
    seats: Map<number, Seat>;
    playedCards: Map<number, Card>;
    bids: Map<number, Bid>;
}

const GameBoard: React.FC<IGameBoardProps> = (props: IGameBoardProps) => {
    const {hand, seats, playedCards, bids} = props;

    const orderedSeats = Array.from(seats.values()).sort((s1,s2) => s1.index - s2.index);

    const playedCard = (index: number) => {
        const playedCard = playedCards.get(index);
        if (playedCard) {
            return <PlayingCard card={playedCard!}></PlayingCard>;
        }
    }

    const bid = (index: number) => {
        const bid = bids.get(index);
        if (bid) {
            return <div>{bid!.number} {Bid.trumpString(bid!.trump)}</div>;
        }
    }

    return (
        <div style={{color: 'white', backgroundColor: '#404040', height: '100%'}}>
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
            >
                {orderedSeats.map(seat => (
                <Grid
                    item
                    direction="column"
                    justify="center"
                    alignItems="center"
                >
                    {playedCard(seat.index)}
                    <TextBubble size="small" text={seat.name.length == 0 ? "Empty" : seat.name} color="green" disabled={seat.empty}></TextBubble>
                    {bid(seat.index)}
                </Grid>
                ))}
            </Grid>
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
            >
                {hand.map((card, index) => (
                    <PlayingCard
                        key={"playing_card_" + index} 
                        card={card} 
                    />
                ))}
            </Grid>
        </div>
    );
};

export default GameBoard;
