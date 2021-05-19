import React from "react";
import { Grid } from "@material-ui/core";
import PlayingCard from "../../Common/PlayingCard";
import TextBubble from "../../Common/TextBubble"
import { Card, SeatDetails } from "../../../proto/shoot_pb";

interface IGameBoardProps {
    hand: Card[],
    seats: SeatDetails[]
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
                    <PlayingCard card={hand[0]}></PlayingCard>
                    <TextBubble size="small" text={seat.getName()} color="green"></TextBubble>
                    <div>3 ♠︎</div>
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
