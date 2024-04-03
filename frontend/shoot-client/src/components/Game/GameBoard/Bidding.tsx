import React from "react";
import { Button, Grid } from "@material-ui/core";
import { useGame } from "../Game.context";
import BidTricksSelector  from "./BidTricksSelector";
import BidTrumpSelector  from "./BidTrumpSelector";
import { Bid } from "../Models/Bid";
import { useStyles } from "../../Common/ButtonGroupSelector"


interface IBiddingProps {
    highBid: Bid | null;
    bids: Map<number, Bid>;
    bidTricksSelected: string | null;
    bidTrumpSelected: string | null;
}

const Bidding: React.FC<IBiddingProps> = (props: IBiddingProps) => {
    const classes = useStyles();
    const [ gameState ] = useGame();
    const { createBid, mySeat, currentBidder, winningBid } = gameState;

    const { highBid, bids, bidTricksSelected, bidTrumpSelected } = props;

    const bid = (index: number) => {
        const bid = bids.get(index);
        return bid ? <div>{bid.number} {Bid.trumpString(bid.trump)}</div> : <div>No Bid</div>;
    }

    const submit_pass = bidTricksSelected == null && bidTrumpSelected == null;
    const submit_enabled = (bidTricksSelected != null && bidTrumpSelected != null) || submit_pass;
    

    const onClick = () => {
        if (submit_pass) {
            createBid(0, 0, Bid.Trump.LOW, mySeat)
            return;
        }

        let tricks = 0;
        let shootNum = 0;

        if (bidTricksSelected === "SHOOT") {
            shootNum = highBid?.shootNum || 0;
            shootNum += 1;
        } else {
            tricks = parseInt(bidTricksSelected || "0");
        }

        let trump = Bid.stringToTrump(bidTrumpSelected || "");

        if (trump !== null && mySeat !== null) {
            createBid(tricks, shootNum, trump, mySeat);
        } else {
            console.log("Error With OnClick");
        }
    }

    if (currentBidder) {
        return (
            <div className="bidding">
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
                        >{ submit_pass ? 'Pass' : 'Place Bid' }</Button>
                </Grid>

            </div>
        );
    } else if (winningBid === null) {
        return (<div className="bidding">Not Bidding</div>)
    } else {
        return (<div></div>)
    }
};

//<Grid>
//    {bid}
//</Grid>

export default Bidding;