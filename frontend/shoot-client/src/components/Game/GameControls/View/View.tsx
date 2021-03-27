import { Button, ButtonGroup } from "@material-ui/core";
import React from "react";
import styled from 'styled-components';

const View: React.FC = () => {
      
    const StyledRoot = styled.div`
        color: #a9a9a9;
        margin: 24px auto;
    `;

    const StyledButtonGroup = styled.div`
        padding: 2px 16px;
        margin: 10px;
    `;

    return (  
        <StyledRoot>
            <div>
                VIEW
            </div>
            <StyledButtonGroup>
                <ButtonGroup aria-label="outlined primary button group">
                    <Button style={{color: 'white', border: '1px solid white'}}>2D</Button>
                    <Button style={{color: 'white', border: '1px solid white'}}>3D</Button>
                </ButtonGroup>
            </StyledButtonGroup>
        </StyledRoot>
    );
};

export default View;
