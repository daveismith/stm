
import { Card } from "./Card"
import { Bid } from "./Bid"

export interface Seat {
    index: number;
    name: string;
    playedCard? : Card;
    bid?: Bid;
}
