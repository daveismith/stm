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

    const onClick = (selectedValue: string) => {
        setGameState({ ...gameState, bidTricksSelected: selectedValue });
    }

    const getItems = () => {
        const items : IButtonGroupItem[] = [
            {value: "1", disabled: false}, 
            {value: "2", disabled: false}, 
            {value: "3", disabled: false},
            {value: "4", disabled: false},
            {value: "5", disabled: false},
            {value: "6", disabled: false},
            {value: "7", disabled: false},
            {value: "8",  disabled: false},
            {value: "SHOOT",  disabled: false}
        ];
        return items;
    }

    console.log('highBid: ' + highBid);

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