import React from "react";
import { Button, ButtonGroup } from "@material-ui/core";
import styled from 'styled-components';
import { makeStyles } from '@material-ui/core/styles';

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
    },
    disabled: {},
    selected: {},
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
                            }}
                            key={name + "_" + index}
                            disabled={item.disabled}
                            //color={item.value ===  selected ? "primary" : "secondary"}
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
