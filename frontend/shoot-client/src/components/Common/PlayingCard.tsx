import React from "react";
import { Card as CardView } from "@material-ui/core";
import styled from 'styled-components';
import { Card } from "../../proto/shoot_pb";

interface IPlayingCardProps {
    card: Card,
}

function suitString(suit: Card.Suit): String {
    switch (suit) {
        case Card.Suit.SPADES:
            return "♠️";
        case Card.Suit.CLUBS:
            return "♣️";
        case Card.Suit.HEARTS:
            return "♥️";
        case Card.Suit.DIAMONDS:
            return "♦️";
        default:
            return "X"
    }
}

function rankString(rank: Card.Rank): String {
    switch (rank) {
        case Card.Rank.ACE:
            return "A";
        case Card.Rank.JACK:
            return "J";
        case Card.Rank.QUEEN:
            return "Q";
        case Card.Rank.KING:
            return "K";
        case Card.Rank.TEN:
            return "10";
        case Card.Rank.NINE:
            return "9";
        case Card.Rank.EIGHT:
            return "8";
        case Card.Rank.SEVEN:
            return "7";
        default:
            return "X"
    }
}

const PlayingCard: React.FC<IPlayingCardProps> = (props: IPlayingCardProps) => {

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

    return (  
        <StyledDiv>
            <CardView>
                <RankDiv>
                    {rankString(props.card.getRank())}
                </RankDiv>
                <SuitDiv>
                    {suitString(props.card.getSuit())}
                </SuitDiv>
            </CardView>
        </StyledDiv>
    );
};

export default PlayingCard;
