import React from "react";
import { useGame } from "../../Game.context";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import styled from 'styled-components';


const View: React.FC = () => {

    const [ gameState, setGameState ] = useGame();
      
    const StyledRoot = styled.div`
        color: #a9a9a9;
        margin: 24px auto;
    `;

    const StyledButtonGroup = styled.div`
        padding: 2px 16px;
        margin: 10px;
    `;

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
                    <ToggleButton value="2D" >2D</ToggleButton>
                    <ToggleButton value="3D" >3D</ToggleButton>
                </ToggleButtonGroup>
            </StyledButtonGroup>
        </StyledRoot>
    );
};

export default View;
