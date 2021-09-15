import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import styled from 'styled-components';
import { Button, Card, Grid } from "@material-ui/core";
import { makeStyles } from '@material-ui/core/styles';
import { useApp } from "../App/App.context";
import "./CreateGame.css";

const StyledDiv = styled.div`
    background-color: #606060;
    height: 100%;
`;

const useStyles = makeStyles({
    card: {
        padding: "32px",
    },
    button: {
        margin: "10px 0px"
    },
});

const CreateGame: React.FC = () => {
    const classes = useStyles();
    const [ appState ] = useApp();
    const { gameId, createGame }  = appState;
    const history = useHistory();

    useEffect(() => {
        if (gameId) {
            history.push('/game/' + appState.gameId);
        }
    });

    return (  
        <StyledDiv>
            <Grid
                container
                spacing={0}
                direction="column"
                alignItems="center"
                justify="center"
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
