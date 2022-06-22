import React from "react";
import styled from 'styled-components';
import { Button, Card, FormControlLabel, Grid, Switch, Typography } from "@material-ui/core";
import { makeStyles } from '@material-ui/core/styles';
import "./SelectSeat.css";
import { useGame } from "../Game/Game.context";

import { Seat } from "../Game/Models/Seat";
import TextBubble from "../Common/TextBubble";

const StyledDiv = styled.div`
    background-color: #606060;
    height: 100%;
`;

const useStyles = makeStyles({
    card: {
        padding: "32px",
    },
    button: {
        margin: "9px 0px"
    },
});

const Ready: React.FC<{seat: Seat}> = ({seat}) => {
    const [ gameState ] = useGame();
    const { mySeat, setSeatReadyStatus } = gameState;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSeatReadyStatus(event.target.checked);
    };

    if (seat.index !== mySeat) {
        return (
            <Typography>{seat.ready ? "Ready" : "Not Ready"}</Typography>
        )
    } else {
        return (
            <FormControlLabel control={<Switch checked={seat.ready} onChange={handleChange} color="default" />} label="Ready" />
        )
    }

}

const SeatEntry: React.FC<{seat: Seat}> = ({seat}) => {
    const classes = useStyles();
    const [ gameState ] = useGame();
    const { takeSeat }  = gameState;

    let colour: string = seat.index % 2 === 0 ? "green" : "blue";

    if (seat.empty) {
        return (
            <div key={seat.index} style={{width: '100%', position: 'relative'}}>
                <span style={{width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', height: '100%'}}><TextBubble size="small" text={(seat.index + 1).toString()} color={colour} /></span>
                <Button variant="contained" className={classes.button} onClick={ () => takeSeat(seat.index) }>Take Seat</Button>
            </div>
        )
    } else {
        return (
            <div key={seat.index} style={{width: '100%', position: 'relative'}}>
                <span style={{width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', height: '100%'}}><TextBubble size="small" text={(seat.index + 1).toString()} color={colour} /></span>
                <Typography variant="h5">{seat.name}</Typography>
                <Ready seat={seat} />
            </div>
        )
    }
}

const SelectSeat: React.FC = () => {
    const classes = useStyles();
    const [ gameState ] = useGame();
    const { seats } = gameState;
    
    const orderedSeats: Array<Seat> = Array.from(seats.values()).sort((s1,s2) => (s1 as Seat).index - (s2 as Seat).index) as Array<Seat>;

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
                        Select A Seat
                    </h2>
                    <br />
                    <h2>
                    ̿̿ ̿̿ ̿̿ ̿'̿'\̵͇̿̿\з= ( ▀ ͜͞ʖ▀) =ε/̵͇̿̿/’̿’̿ ̿ ̿̿ ̿̿ ̿̿
                    </h2>
                    <br />
                    {
                        orderedSeats.map((seat: Seat) => {
                            return ( <SeatEntry key={seat.index} seat={seat} /> )
                        })
                    }
                </Card>
            </Grid>

        </StyledDiv>
    );
};

export default SelectSeat;
