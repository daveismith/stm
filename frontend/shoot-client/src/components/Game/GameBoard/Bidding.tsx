import React from "react";
import { Button, Grid } from "@material-ui/core";
import { useApp } from "../../App/App.context";
import BidTricksSelector  from "./BidTricksSelector";
import BidTrumpSelector  from "./BidTrumpSelector";
import { Bid } from "../Models/Bid";
import { useStyles } from "../../Common/ButtonGroupSelector"


interface IBiddingProps {
    highBid: Bid | null;
    bids: Map<number, Bid>;
    bidTricksSelected: string | null;
    bidTrumpSelected: string | null;
    currentBidder: boolean;
}

const Bidding: React.FC<IBiddingProps> = (props: IBiddingProps) => {
    const classes = useStyles();
    const [ appState ] = useApp();
    const { createBid, currentSeat } = appState;

    const { highBid, bids, bidTricksSelected, bidTrumpSelected, currentBidder } = props;

    const bid = (index: number) => {
        const bid = bids.get(index);
        return bid ? <div>{bid.number} {Bid.trumpString(bid.trump)}</div> : <div>No Bid</div>;
    }

    const submit_enabled = bidTricksSelected != null && bidTrumpSelected != null;

    const onClick = () => {
        let tricks = 0;
        let shootNum = 0;

        if (bidTricksSelected === "SHOOT") {
            shootNum = highBid?.shootNum || 0;
            shootNum += 1;
        } else {
            tricks = parseInt(bidTricksSelected || "0");
        }

        let trump = Bid.stringToTrump(bidTrumpSelected || "");

        if (trump !== null && currentSeat !== null) {
            createBid(tricks, shootNum, trump, currentSeat);
        } else {
            console.log("Error With OnClick");
        }
    }

    if (currentBidder) {
        return (
            <>
                <Grid
                    container
                    direction="row"
                    justify="center"
                    alignItems="center"
                >
                    <BidTricksSelector highBid={highBid} bidTricksSelected={bidTricksSelected}/>
                </Grid>
                <Grid
                    container
                    direction="row"
                    justify="center"
                    alignItems="center"
                >
                    <BidTrumpSelector bidTrumpSelected = {bidTrumpSelected}/> 
                    <Button 
                            classes={{
                                root: classes.root,
                                disabled: classes.disabled,
                                outlined: classes.outlined,
                            }}
                            disabled={!submit_enabled}
                            variant={submit_enabled ? "outlined" : "text"}
                            onClick={() => onClick()}
                        >Place Bid</Button>                    
                </Grid>
                <Grid>
                    {bid}
                </Grid>
            </>
        );
    } else {
        return (<div>Not Bidding</div>)
    }
};

export default Bidding;