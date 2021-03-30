import { Chip } from "@material-ui/core";
import React from "react";
import styled from 'styled-components';

interface ITextBubbleProps {
    text: string;
    color: string;
    size: any;
}

const TextBubble: React.FC<ITextBubbleProps> = (props: ITextBubbleProps) => {

    const StyledSpan = styled.span`
        border-radius: 12px;
        margin: 10px;
    `;

    return (  
        <StyledSpan>
            <Chip size={props.size} label={props.text} style={{ color:'#ffffff', backgroundColor: props.color }}/>
        </StyledSpan>
    );
};

export default TextBubble;
