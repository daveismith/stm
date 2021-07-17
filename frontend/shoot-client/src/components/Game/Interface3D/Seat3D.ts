class Seat3D {
    index: number;
    name: string;
    empty: boolean;
    human: boolean;
    ready: boolean;

    constructor(index: number, name: string, empty: boolean, human: boolean, ready: boolean) {
        this.index = index;
        this.name = name;
        this.empty = empty;
        this.human = human;
        this.ready = ready;
    }
};

export { Seat3D };