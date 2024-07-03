import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from 'styled-components';
import { Button, Card, Grid } from "@mui/material";
import { tss } from "tss-react/mui";

import { useApp } from "../App/App.context";
import "./CreateGame.css";

const StyledDiv = styled.div`
    background-color: #606060;
    height: 100%;
`;

const useStyles = tss.create({
    card: {
        padding: "32px",
    },
    button: {
        margin: "10px 0px"
    },
});

const CreateGame: React.FC = () => {
    const { classes } = useStyles();
    const [ appState ] = useApp();
    const { gameId, createGame }  = appState;
    const navigate = useNavigate();

    useEffect(() => {
        if (gameId) {
            navigate('/game/' + appState.gameId);
        }
    });

    return (  
        <StyledDiv>
            <Grid
                container
                spacing={0}
                direction="column"
                alignItems="center"
                justifyContent="center"
                style={{ minHeight: '100vh' }}
            >
                <Card className={classes.card}>
                    <h2>
                        SHOOT THE MOON 
                    </h2>
                    <br />
                    <h2>
                    ̿̿ ̿̿ ̿̿ ̿'̿'\̵͇̿̿\з= ( ▀ ͜͞ʖ▀) =ε/̵͇̿̿/’̿’̿ ̿ ̿̿ ̿̿ ̿̿
                    </h2>
                    <br />
                    <Button variant="contained" className={classes.button} onClick={ () => createGame(2) }>Create 2 Player Game</Button>
                    <br />
                    <Button variant="contained" className={classes.button} onClick={ () => createGame(4) }>Create 4 Player Game</Button>
                    <br />
                    <Button variant="contained" className={classes.button} onClick={ () => createGame(6) }>Create 6 Player Game</Button>
                    <br />
                </Card>
            </Grid>

        </StyledDiv>
    );
};

export default CreateGame;
