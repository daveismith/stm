import React from "react";
import ControlsMenu from "./ControlsMenu/ControlsMenu";
import TeamScore from "./TeamScore/TeamScore";
import View from "./View/View";
import "./GameControls.css";
import TrumpView from "./TrumpView/TrumpView";
import { Bid } from "../Models/Bid";

interface IGameControlsProps {
    score: number[],
    tricks: number[],
    winningBid: Bid | null
}

const GameControls: React.FC<IGameControlsProps> = (props: IGameControlsProps) => {
 	const {score, tricks, winningBid} = props;
    
    return (	
        <div className="game-controls">
            <div className="column">
                <div className="row-1">
                    <ControlsMenu></ControlsMenu>
                </div>
                <div className="row-1"> 
                    <TeamScore 
                        label={"SCORE"}
                        t1Text={score[0].toString()}
                        t1Color={"green"}
                        t2Text={score[1].toString()}
                        t2Color={"blue"}
                    >
                    </TeamScore>
                </div>
                <div className="row-1"> 
                    <TeamScore 
                        label={"TRICKS"}
                        t1Text={tricks[0].toString()}
                        t1Color={"green"}
                        t2Text={tricks[1].toString()}
                        t2Color={"blue"}
                    >
                    </TeamScore>
                </div>
                <div className="row-1">
                    <TrumpView currentBid={winningBid} />
                </div>
                <div className="row-1"> 
                    <View></View>
                </div>
            </div>
        </div>
    );
};

export default GameControls;
