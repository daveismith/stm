import React from "react";
import { Card as CardView } from "@mui/material";
import styled from 'styled-components';
import { Card } from "../Game/Models/Card";

interface IPlayingCardProps {
    card: Card,
    clickable?: boolean,
    illegal?: boolean,
    remove?: boolean,
    fade?: boolean,
    onClick?: (card: Card) => void
}


const StyledDiv = styled.div`
border-radius: 12px;
margin: 15px 10px;
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
    const clickable = props.clickable || false;
    const illegal = props.illegal || false;
    const remove = props.remove || false;
    const fade = props.fade || false;
    const suit = props.card.suit;
    const color = (suit === Card.Suit.DIAMONDS || suit === Card.Suit.HEARTS) ? "red" : "black";

    const onClick = () => {
        if (props.onClick !== undefined) {
            props.onClick(props.card);
        }
    }

    return (  
        <StyledDiv onClick={onClick} className={`card ${clickable ? (illegal ? 'illegal' : 'clickable') : ''} ${remove ? 'remove' : ''} ${fade ? 'fade' : ''}`}>
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
