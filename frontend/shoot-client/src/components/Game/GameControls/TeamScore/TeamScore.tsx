import React from "react";
import TextBubble from "../../../Common/TextBubble";
import styled from 'styled-components';

interface ITeamScoreProps {
    label: string;
    t1Text: string;
    t1Color: string;
    t2Text: string;
    t2Color: string;
}

const StyledRoot = styled.div`
    margin: 24px auto;
`;

const StyledLabel = styled.div`
    color: #a9a9a9;
`;

const StyledTextBubble = styled.div`
    margin: 10px;
`;

const TeamScore: React.FC<ITeamScoreProps> = (props: ITeamScoreProps) => {
    return (  
        <StyledRoot>
            <StyledLabel>
                {props.label}
            </StyledLabel>
            <StyledTextBubble>
                <TextBubble size="small" text={props.t1Text} color={props.t1Color}></TextBubble>
                <TextBubble size="small" text={props.t2Text} color={props.t2Color}></TextBubble>
            </StyledTextBubble>
        </StyledRoot>
    );
};

export default TeamScore;
