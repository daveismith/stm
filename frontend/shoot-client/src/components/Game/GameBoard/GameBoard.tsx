import React from "react";
import { Grid } from "@material-ui/core";
import { useApp } from "../../App/App.context";
import PlayingCard from "../../Common/PlayingCard";
import TextBubble from "../../Common/TextBubble"
import { Card } from "../Models/Card";
import { Seat } from "../Models/Seat";
import { Bid } from "../Models/Bid";
import Bidding from "./Bidding";

interface IGameBoardProps {
    hand: Card[];
    seats: Map<number, Seat>;
    playedCards: Map<number, Card>;
    highBid: Bid | null;
    bids: Map<number, Bid>;
    currentBidder: boolean;
    bidTricksSelected: string | null;
    bidTrumpSelected: string | null;
}

const GameBoard: React.FC<IGameBoardProps> = (props: IGameBoardProps) => {
    const [ appState ] = useApp();
    
    const { currentSeat } = appState;

    const { hand, seats, playedCards, currentBidder, highBid, bids, bidTricksSelected, bidTrumpSelected  } = props;

    const orderedSeats = Array.from(seats.values()).sort((s1,s2) => s1.index - s2.index);

    const playedCard = (index: number) => {
        const playedCard = playedCards.get(index);
        return playedCard && <PlayingCard card={playedCard}></PlayingCard>;
    }

    const bid = (index: number) => {
        const bid = bids.get(index);
        return bid && <div>{bid.number} {Bid.trumpString(bid.trump)}</div>;
    }

    return (
        <div style={{color: 'white', backgroundColor: '#404040', height: '100%'}}>
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
            >
                {orderedSeats.map((seat, index) => (
                <Grid
                    item
                    direction="column"
                    justify="center"
                    alignItems="center"
                    key={index}
                >
                    {playedCard(seat.index)}
                    <TextBubble size="small" text={seat.name.length === 0 ? "Empty" : seat.name} color="green" disabled={seat.empty}></TextBubble>
                    { (seat.index === currentSeat) ? 'My Seat' : null}
                    {bid(seat.index)}
                </Grid>
                ))}
            </Grid>
            <Bidding highBid={highBid} bids={bids} bidTricksSelected={bidTricksSelected} bidTrumpSelected={bidTrumpSelected} currentBidder={currentBidder} />
            <div style={{bottom: 0, left: 0, right: '25%', position: 'absolute', display: 'flex', justifyContent: 'center', marginBottom: '2em', marginTop: '2em'}}>
                {
                    hand.map((card, index) => (
                        <PlayingCard
                            key={"playing_card_" + index} 
                            card={card} 
                        />)
                    )
                }
            </div>
        </div>
    );
};

export default GameBoard;

/*
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
            >
                <BidTricksSelector bidTricksSelected = {bidTricksSelected}/>
            </Grid>
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
            >
                <BidTrumpSelector bidTrumpSelected = {bidTrumpSelected}/>
            </Grid>
            */