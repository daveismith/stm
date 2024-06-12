import React from "react";
import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import styled from 'styled-components';

const StyledRoot = styled.div`
    width: 100%;
`;

const ControlsMenu: React.FC = () => {
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
