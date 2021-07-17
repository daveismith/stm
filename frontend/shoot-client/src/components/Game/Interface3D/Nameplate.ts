import {
    AdvancedDynamicTexture,
    Control,
    Rectangle,
    TextBlock
} from "@babylonjs/gui";

import { SceneController } from "./SceneController";

class Nameplate {
    plate: Rectangle = new Rectangle();
    textBlock: TextBlock = new TextBlock();
    player: number;
    name: string;
    static emptySeatLabel: string = "Waiting for Player";

    constructor (manager2D: AdvancedDynamicTexture, player: number) {
        this.player = player;
        this.plate.width = 0.2;
        this.plate.height = 0.04;
        this.plate.cornerRadius = 20;
        this.plate.color = "white";
        this.plate.thickness = 3;
        this.plate.background = "navy";
        this.plate.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        manager2D.addControl(this.plate);

        if (SceneController.seats[player] && !SceneController.seats[player].empty)
            this.name = SceneController.seats[player].name;
        else
            this.name = Nameplate.emptySeatLabel;
        this.textBlock.text = this.name;
        this.plate.addControl(this.textBlock);

        this.plate.linkWithMesh(SceneController.seatCubes[player].mesh);
        this.plate.linkOffsetY = -100;

    }

    updateName (name: string) {
        this.name = name;
        this.textBlock.text = name;
    }

    disable () {
        this.plate.isVisible = false;
    }
}

export { Nameplate };