import React from "react";
import { Card } from "@material-ui/core";
import styled from 'styled-components';

export enum Suit {
    Spade,
    Club,
    Heart,
    Diamond,
}

export namespace Suit {
    export function symbol(suit: Suit): String {
        switch (suit) {
            case Suit.Spade:
                return "♠️";
            case Suit.Club:
                return "♣️";
            case Suit.Heart:
                return "♥️";
            case Suit.Diamond:
                return "♦️";
            default:
                return "X"
        }
    }
}

export enum Rank {
    Ace = 1,
    Two,
    Three,
    Four,
    Five,
    Six,
    Seven,
    Eight,
    Nine,
    Ten,
    Jack,
    Queen,
    King
}

export namespace Rank {
    export function symbol(rank: Rank): String {
        switch (rank) {
            case Rank.Ace:
                return "A";
            case Rank.Jack:
                return "J";
            case Rank.Queen:
                return "Q";
            case Rank.King:
                return "K";
            default:
                return rank.toString()
        }
    }
}

interface IPlayingCardProps {
    suit: Suit,
    rank: Rank
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
            <Card>
                <RankDiv>
                    {Rank.symbol(props.rank)}
                </RankDiv>
                <SuitDiv>
                    {Suit.symbol(props.suit)}
                </SuitDiv>
            </Card>
        </StyledDiv>
    );
};

export default PlayingCard;
