import React from "react";
import { useGame } from "../Game/Game.context";
import { Dialog, DialogContent, DialogActions, TextField, Button } from "@material-ui/core";
import styled from 'styled-components';


const NameDialog: React.FC = () => {

    const StyledSpan = styled.span`
        border-radius: 12px;
        margin: 10px;
    `;

    const [ gameState, setGameState ] = useGame();

    const setName = (name: string) => {
        setGameState({...gameState, playerName: name ? name : 'no-name'});
    }

    return (  
        <StyledSpan>
            <Dialog open={true} aria-labelledby="form-dialog-title">
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Name"
                        type="email"
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setName("test")} color="primary">
                        Ok
                    </Button>
                </DialogActions>
            </Dialog>
        </StyledSpan>
    );
};

export default NameDialog;
