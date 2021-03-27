import React from "react";
import ControlsMenu from "./ControlsMenu/ControlsMenu";
import TeamScore from "./TeamScore/TeamScore";
import View from "./View/View";
import "./GameControls.css";

const GameControls: React.FC = () => {
      
    return (  
        <div className="game-controls">
            <div className="column">
                <div className="row-1">
                    <ControlsMenu></ControlsMenu>
                </div>
                <div className="row-1"> 
                    <TeamScore 
                        label={"SCORE"}
                        t1Text={"43"}
                        t1Color={"green"}
                        t2Text={"37"}
                        t2Color={"blue"}
                    >
                    </TeamScore>
                </div>
                <div className="row-1"> 
                    <TeamScore 
                        label={"TRICKS"}
                        t1Text={"3"}
                        t1Color={"green"}
                        t2Text={"1"}
                        t2Color={"blue"}
                    >
                    </TeamScore>
                </div>
                <div className="row-1"> 
                    <View></View>
                </div>
            </div>
        </div>
    );
};

export default GameControls;
