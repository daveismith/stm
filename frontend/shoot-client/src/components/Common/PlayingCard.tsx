import React from "react";
import { Card as CardView } from "@material-ui/core";
import styled from 'styled-components';
import { Card } from "../Game/Models/Card";

interface IPlayingCardProps {
    card: Card,
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
                    {Card.rankString(props.card.rank)}
                </RankDiv>
                <SuitDiv>
                    {Card.suitString(props.card.suit)}
                </SuitDiv>
            </CardView>
        </StyledDiv>
    );
};

export default PlayingCard;
