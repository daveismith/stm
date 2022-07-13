import React from "react";
import TextBubble from "../../../Common/TextBubble";
import styled from 'styled-components';
import { Bid } from "../../Models/Bid";

interface ITrumpViewProps {
    currentBid: Bid | null;
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

const TrumpView: React.FC<ITrumpViewProps> = (props: ITrumpViewProps) => {
    const currentBid = props.currentBid;
    console.log('currentBid: ');
    console.log(currentBid);

    return (  
        <StyledRoot>
            <StyledLabel>
                WINNING BID
            </StyledLabel>
            <StyledTextBubble>
                {
                    (currentBid !== null) ? 
                        (<TextBubble size="small" text={`${currentBid.number} ${Bid.trumpString(currentBid.trump)}`} color={`${currentBid.seat % 2 === 0 ? 'green' : 'blue'}`} />) : 
                        (<TextBubble size="small" text={`No Winning Bid`} color="gray" />)
                }
            </StyledTextBubble>
        </StyledRoot>
    );
};

export default TrumpView;
