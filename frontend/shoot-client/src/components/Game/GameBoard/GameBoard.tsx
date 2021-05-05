import React from "react";
import { Grid } from "@material-ui/core";
import PlayingCard from "../../Common/PlayingCard";
import { Card } from "../../../proto/shoot_pb";

interface IGameBoardProps {
    hand: Card[]
}

const GameBoard: React.FC<IGameBoardProps> = (props: IGameBoardProps) => {
    const {hand} = props;

    return (
        <div style={{color: 'white', backgroundColor: '#404040', height: '100%'}}>
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
