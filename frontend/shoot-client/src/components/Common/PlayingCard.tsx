import React from "react";
import { Card } from "@material-ui/core";
import styled from 'styled-components';

interface IPlayingCardProps {
    suit: string,
    rank: string
}

const PlayingCard: React.FC<IPlayingCardProps> = (props: IPlayingCardProps) => {

    const StyledDiv = styled.div`
        font-size: 20px;
        border-radius: 12px;
        margin: 10px;
        width: 80px;
    `;

    const RankDiv = styled.div`
        padding: 16px 0px;
    `;

    const SuitDiv = styled.div`
        padding: 0px 0px 32px 0px;
    `;

    return (  
        <StyledDiv>
            <Card>
                <RankDiv>
                    {props.rank}
                </RankDiv>
                <SuitDiv>
                    {props.suit}
                </SuitDiv>
            </Card>
        </StyledDiv>
    );
};

export default PlayingCard;
