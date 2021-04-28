import React from "react";
import { Grid } from "@material-ui/core";
import PlayingCard from "../../Common/PlayingCard";
import {Suit, Rank} from "../../Common/PlayingCard";

interface IGameBoardProps {
    score: number[],
    tricks: number[]
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
            <PlayingCard suit={Suit.Spade} rank={Rank.Ten}></PlayingCard>
            <PlayingCard suit={Suit.Heart} rank={Rank.Ace}></PlayingCard>
            <PlayingCard suit={Suit.Club} rank={Rank.Queen}></PlayingCard>
            </Grid>
        </div>
    );
};

export default GameBoard;
