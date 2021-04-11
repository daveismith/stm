import React from "react";
import PlayingCard from "../../Common/PlayingCard";
import {Suit, Rank} from "../../Common/PlayingCard";

const GameBoard: React.FC = () => {
      
    return (  
        <div style={{color: 'white', backgroundColor: '#404040', height: '100%'}}>
            <PlayingCard suit={Suit.Spade} rank={Rank.Ten}></PlayingCard>
            <PlayingCard suit={Suit.Heart} rank={Rank.Ace}></PlayingCard>
            <PlayingCard suit={Suit.Club} rank={Rank.Queen}></PlayingCard>
        </div>
    );
};

export default GameBoard;
