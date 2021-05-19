import React from "react";
import { Grid } from "@material-ui/core";
import PlayingCard from "../../Common/PlayingCard";
import TextBubble from "../../Common/TextBubble"
import { Card } from "../Models/Card";
import { Seat } from "../Models/Seat";
import { Bid } from "../Models/Bid";

interface IGameBoardProps {
    hand: Card[],
    seats: Seat[]
}

const GameBoard: React.FC<IGameBoardProps> = (props: IGameBoardProps) => {
    const {hand, seats} = props;

    return (
        <div style={{color: 'white', backgroundColor: '#404040', height: '100%'}}>
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
            >
                {seats.map(seat => (
                <Grid
                    item
                    direction="column"
                    justify="center"
                    alignItems="center"
                >
                    {seat.playedCard && <PlayingCard card={seat.playedCard!}></PlayingCard> }
                    <TextBubble size="small" text={seat.name} color="green"></TextBubble>
                    {seat.bid && <div>{seat.bid!.number} {Bid.trumpString(seat.bid!.trump)}</div> }
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
