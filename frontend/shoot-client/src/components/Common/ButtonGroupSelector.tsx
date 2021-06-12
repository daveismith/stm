import React from "react";
import { Button, ButtonGroup } from "@material-ui/core";
import styled from 'styled-components';

export interface IButtonGroupItem {
    value: string;
    disabled: boolean;
}

interface IButtonGroupSelectorProps {
    items: IButtonGroupItem[];
    selected: string | null;
    onClick(selectedValue: string) : void;
}

const StyledSpan = styled.span`
    border-radius: 12px;
    margin: 10px;
`;

const ButtonGroupSelector: React.FC<IButtonGroupSelectorProps> = (props: IButtonGroupSelectorProps) => {

    const { items, selected, onClick } = props;

    return (  
        <StyledSpan>
            <ButtonGroup>
                {
                    items.map((item, index) => (
                        <Button 
                            disabled={item.disabled}
                            color={item.value ===  selected ? "primary" : "secondary"}
                            onClick={() => onClick(item.value)}
                        >
                            {item.value}
                        </Button>
                    ))
                }
            </ButtonGroup>
        </StyledSpan>
    );
};

export default ButtonGroupSelector;
