import React from "react";
import { Chip } from "@mui/material";
import styled from 'styled-components';

interface ITextBubbleProps {
    text: string;
    color: string;
    size: any;
    disabled?: boolean;
}

const StyledSpan = styled.span`
    border-radius: 12px;
    margin: 10px;
`;

const TextBubble: React.FC<ITextBubbleProps> = (props: ITextBubbleProps) => {
    return (  
        <StyledSpan>
            <Chip 
                size={props.size} 
                label={props.text} 
                style={{ color: props.disabled ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 1)', backgroundColor: props.color }}
            />
        </StyledSpan>
    );
};

export default TextBubble;
