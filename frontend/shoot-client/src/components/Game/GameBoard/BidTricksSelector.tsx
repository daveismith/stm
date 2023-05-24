import React from "react";
import { useGame } from "../Game.context";
import ButtonGroupSelector, { IButtonGroupItem } from "../../Common/ButtonGroupSelector";
import { Bid } from "../Models/Bid";

interface IBidTricksSelector {
    highBid: Bid | null;
    bidTricksSelected: string | null;
}

const BidTricksSelector: React.FC<IBidTricksSelector> = (props: IBidTricksSelector) => {

    const { highBid, bidTricksSelected } = props;
    const [ gameState, setGameState ] = useGame();

    const bidNumber = highBid != null ? highBid.number : 0;

    const onClick = (selectedValue: string) => {
        setGameState({ ...gameState, bidTricksSelected: selectedValue });
    }

    const getItems = () => {
        const items : IButtonGroupItem[] = [];
        for (let val = 1; val <= 8; val++) {
            items.push({value: val.toString(), disabled: bidNumber >= val});
        }
        items.push({value: 'SHOOT', disabled: false});
        return items;
    }

    return (  
        <ButtonGroupSelector 
            name = { "tricks_selector" }
            items = { getItems() } 
            selected = { bidTricksSelected } 
            onClick={ onClick }
        />
    );
};

export default BidTricksSelector;