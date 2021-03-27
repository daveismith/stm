import React from "react";
import styled from 'styled-components';

interface ITextBubbleProps {
    text: string;
    color: string;
}

const TextBubble: React.FC<ITextBubbleProps> = (props: ITextBubbleProps) => {

    const StyledSpan = styled.span`
        color: #ffffff;
        background-color: ${props.color};
        padding: 2px 16px;
        border-radius: 12px;
        margin: 10px;
    `;

    return (  
        <StyledSpan>
            { props.text }
        </StyledSpan>
    );
};

export default TextBubble;
