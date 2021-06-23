import React from "react";
import { Button, ButtonGroup } from "@material-ui/core";
import styled from 'styled-components';
import { makeStyles } from '@material-ui/core/styles';
import { shadows } from '@material-ui/system';

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

const useStyles = makeStyles({
    root: {
      background: '#363636',
      borderRadius: 30,
      color: '#FFFFFF',
      height: 48,
      fontSize: '1.5rem',
      '&$disabled': {
        color: '#606060',
      },
      '&$outlined': {
        background: "#a9a9a9",
        border: 0,
        margin: 0,
        padding: 0,
      },
    },
    disabled: {},
    outlined: {},
    label: {
        height: 10,
    }
  });

const ButtonGroupSelector: React.FC<IButtonGroupSelectorProps> = (props: IButtonGroupSelectorProps) => {

    const classes = useStyles();
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
