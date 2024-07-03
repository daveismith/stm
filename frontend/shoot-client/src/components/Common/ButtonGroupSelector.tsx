import React from "react";
import { Button, ButtonGroup } from "@mui/material";
import styled from 'styled-components';
import { tss } from "tss-react/mui";

export interface IButtonGroupItem {
    value: string;
    disabled: boolean;
}

interface IButtonGroupSelectorProps {
    name: string;
    items: IButtonGroupItem[];
    selected: string | null;
    onClick(selectedValue: string) : void;
}

const StyledDiv = styled.span`
    margin: 10px;
`;

export const useStyles = tss.create({
    root: {
      background: '#363636',
      borderRadius: 30,
      color: '#FFFFFF',
      height: 48,
      padding: 10,
      fontSize: '1.5rem',
    },
    groupedOutlined: {
        "&:first-child": {
          marginLeft: 0,
        },
    },
    disabled: {
        color: '#606060',
    },
    outlined: {
        background: "#a9a9a9",
        border: 0,
        margin: 0,
        padding: 10,
    },
    label: {
        height: 10,
    }
  });

const ButtonGroupSelector: React.FC<IButtonGroupSelectorProps> = (props: IButtonGroupSelectorProps) => {

    const {classes} = useStyles();
    const { name, items, selected, onClick } = props;

    return (  
        <StyledDiv>
            <ButtonGroup>
                {
                    items.map((item, index) => (
                        <Button 
                            classes={{
                                root: classes.root,
                                disabled: classes.disabled,
                                outlined: classes.outlined,
                            }}
                            key={name + "_" + index}
                            disabled={item.disabled}
                            variant={item.value === selected ? "outlined" : "text"}
                            onClick={() => onClick(item.value)}
                        >
                            {item.value}
                        </Button>
                    ))
                }
            </ButtonGroup>
        </StyledDiv>
    );
};

export default ButtonGroupSelector;
