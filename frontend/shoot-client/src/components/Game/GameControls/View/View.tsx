import React from "react";
import { useGame } from "../../Game.context";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import styled from 'styled-components';

const StyledRoot = styled.div`
    color: #a9a9a9;
    margin: 24px auto;
`;

const StyledButtonGroup = styled.div`
    padding: 2px 16px;
    margin: 10px;
`;

const StyledButton = styled(ToggleButton)({
    '& span': {
        color: 'white'
    }
});

const View: React.FC = () => {

    const [ gameState, setGameState ] = useGame();
      
    const viewChange = (event :object, value: any) => {
        setGameState({...gameState, sceneView: value === "2D" ? false : true });
    }

    return (  
        <StyledRoot>
            <div>
                VIEW
            </div>
            <StyledButtonGroup>
                <ToggleButtonGroup onChange={viewChange} value={gameState.sceneView ? "3D" : "2D"} exclusive >
					<StyledButton value="2D" >2D</StyledButton>
                    <StyledButton value="3D" >3D</StyledButton>
                </ToggleButtonGroup>
            </StyledButtonGroup>
        </StyledRoot>
    );
};

export default View;
