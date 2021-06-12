import React from "react";
import { useGame } from "../Game.context";
import ButtonGroupSelector, { IButtonGroupItem } from "../../Common/ButtonGroupSelector";

interface IBidTrumpsSelector {
    bidTrumpSelected: string | null;
}

const BidTrumpSelector: React.FC<IBidTrumpsSelector> = (props: IBidTrumpsSelector) => {

    const { bidTrumpSelected } = props;
    const [ gameState, setGameState ] = useGame();

    const onClick = (selectedValue: string) => {
        setGameState({ ...gameState, bidTrumpSelected: selectedValue });
    }

    const getItems = () => {
        const items : IButtonGroupItem[] = [
            {value: "♠️", disabled: false}, 
            {value: "♣️", disabled: false}, 
            {value: "♥️", disabled: false},
            {value: "♦️", disabled: false},
            {value: "⬇︎", disabled: false},
            {value: "⬆︎", disabled: false}
        ];
        return items;
    }

    return (  
        <ButtonGroupSelector 
            items = { getItems() } 
            selected = { bidTrumpSelected } 
            onClick={ onClick }
        />
    );
};

export default BidTrumpSelector;
