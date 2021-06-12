import React from "react";
import { useGame } from "../Game.context";
import ButtonGroupSelector, { IButtonGroupItem } from "../../Common/ButtonGroupSelector";

interface IBidTricksSelector {
    bidTricksSelected: string | null;
}

const BidTricksSelector: React.FC<IBidTricksSelector> = (props: IBidTricksSelector) => {

    const { bidTricksSelected } = props;
    const [ gameState, setGameState ] = useGame();

    const onClick = (selectedValue: string) => {
        setGameState({ ...gameState, bidTricksSelected: selectedValue });
    }

    const getItems = () => {
        const items : IButtonGroupItem[] = [
            {value: "1", disabled: true}, 
            {value: "2", disabled: true}, 
            {value: "3", disabled: true},
            {value: "4", disabled: false},
            {value: "5", disabled: false},
            {value: "6", disabled: false},
            {value: "7", disabled: false},
            {value: "8",  disabled: false},
            {value: "SHOOT",  disabled: false}
        ];
        return items;
    }

    return (  
        <ButtonGroupSelector 
            items = { getItems() } 
            selected = { bidTricksSelected } 
            onClick={ onClick }
        />
    );
};

export default BidTricksSelector;