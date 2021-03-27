import { AppBar, IconButton, Toolbar, Typography } from "@material-ui/core";
import MenuIcon from '@material-ui/icons/Menu';
import React from "react";

const ControlsMenu: React.FC = () => {
      
    return (  
        <div>
            <AppBar position="static" style={{ background: 'black' }}>
            <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="menu">
                <MenuIcon />
                </IconButton>
                <Typography variant="h6">
                    SHOOT THE MOON
                </Typography>
            </Toolbar>
            </AppBar>
        </div>
    );
};

export default ControlsMenu;
