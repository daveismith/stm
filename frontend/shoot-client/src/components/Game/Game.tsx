import React from "react";
import SceneComponent from "./SceneComponent";
import { onSceneReady, onRender } from "./SceneFunctions";

const Game: React.FC = () => {

    const divStyle = {
        height: '100%',
        width: '100%',
      };
      
    return (  
        <div>
            <SceneComponent antialias onSceneReady={onSceneReady} onRender={onRender} id="my-canvas" style={divStyle} />
        </div>
    );
};

export default Game;