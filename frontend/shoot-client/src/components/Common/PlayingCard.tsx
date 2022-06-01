import React from "react";
import { Card as CardView } from "@material-ui/core";
import styled from 'styled-components';
import { Card } from "../Game/Models/Card";

interface IPlayingCardProps {
    card: Card,
    onClick?: React.MouseEventHandler<HTMLDivElement>
}


const StyledDiv = styled.div`
border-radius: 12px;
margin: 10px;
width: 55px;
`;

const RankDiv = styled.div`
font-size: 32px;
font-weight: bold;
padding: 6px 0px 4px 0px;
`;

const SuitDiv = styled.div`
font-size: 26px;
padding: 0px 0px 6px 0px;
`;

const PlayingCard: React.FC<IPlayingCardProps> = (props: IPlayingCardProps) => {

    const suit = props.card.suit;
    const color = (suit === Card.Suit.DIAMONDS || suit === Card.Suit.HEARTS) ? "red" : "black";


    return (  
        <StyledDiv onClick={props.onClick}>
            <CardView>
                <RankDiv style={{color: `${color}`}}>
                    {Card.rankString(props.card.rank)}
                </RankDiv>
                <SuitDiv style={{color: `${color}`}}>
                    {Card.suitString(props.card.suit)}
                </SuitDiv>
            </CardView>
        </StyledDiv>
    );
};

export default PlayingCard;
