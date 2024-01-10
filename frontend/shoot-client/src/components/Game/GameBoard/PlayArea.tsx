import React from "react";
import Bidding from "./Bidding";
import { useGame } from "../Game.context";
import { Grid } from "@material-ui/core";
import TextBubble from "../../Common/TextBubble";

const PlayArea: React.FC = () => {
    const [ gameState ] = useGame();

    const { seats, highBid, bids, bidTricksSelected, bidTrumpSelected } = gameState;


    return (
        <div className="playArea">
            <Bidding highBid={highBid} bids={bids} bidTricksSelected={bidTricksSelected} bidTrumpSelected={bidTrumpSelected} />
        </div>
    )

};

export default PlayArea;