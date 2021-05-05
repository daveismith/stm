import React, { useState } from "react";
import { useGame } from "../Game/Game.context";
import { Dialog, DialogContent, DialogActions, TextField, Button } from "@material-ui/core";

const NameDialog: React.FC = () => {

    const [ name, setName ] = useState("");
    const [ gameState, setGameState ] = useGame();

    const storeName = () => {
        setGameState({...gameState, playerName: name ? name : 'no-name'});
    }

    const handleNameChange = (event: any) => {
        setName(event.target.value);
    }

    const keyPress = (event: any) => {
        //press enter key
        if(event.charCode === 13){
            setGameState({...gameState, playerName: name ? name : 'no-name'});
        }
     }

    return (  
        <div>
            <Dialog open={true} aria-labelledby="form-dialog-title">
                <DialogContent>
                    <TextField
                        id="name"
                        label="Name"
                        onChange={handleNameChange}
                        onKeyPress={keyPress}
                        defaultValue={name}
                        autoFocus
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={storeName} color="primary">
                        Ok
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default NameDialog;
