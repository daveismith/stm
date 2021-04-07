import React from "react";
import PlayingCard from "../../Common/PlayingCard";

const GameBoard: React.FC = () => {
      
    return (  
        <div style={{color: 'white', backgroundColor: '#404040', height: '100%'}}>
            <PlayingCard suit="spades" rank="10"></PlayingCard>
            <PlayingCard suit="hearts" rank="A"></PlayingCard>
            <PlayingCard suit="clubs" rank="Q"></PlayingCard>
        </div>
    );
};

export default GameBoard;
