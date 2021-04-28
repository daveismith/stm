import React from "react";
import { Card } from "@material-ui/core";
import styled from 'styled-components';
import {CardData, Suit, Rank} from "./GameData"

interface IPlayingCardProps {
    card: CardData,
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
                    {Rank.symbol(props.card.rank)}
                </RankDiv>
                <SuitDiv>
                    {Suit.symbol(props.card.suit)}
                </SuitDiv>
            </Card>
        </StyledDiv>
    );
};

export default PlayingCard;
