import React from "react";
import { AppBar, IconButton, Toolbar, Typography } from "@material-ui/core";
import MenuIcon from '@material-ui/icons/Menu';
import styled from 'styled-components';

const ControlsMenu: React.FC = () => {
      
    const StyledRoot = styled.div`
        width: 100%;
    `;

    return (  
        <StyledRoot>
            <AppBar position="static" style={{ background: '#202020' }}>
            <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="menu">
                <MenuIcon />
                </IconButton>
                <Typography variant="h6">
                    SHOOT THE MOON
                </Typography>
            </Toolbar>
            </AppBar>
        </StyledRoot>
    );
};

export default ControlsMenu;
