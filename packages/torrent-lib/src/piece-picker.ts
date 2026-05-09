import type { PiecePicker } from './types'

export class SequentialPiecePicker implements PiecePicker {
  private have: boolean[]

  constructor(totalPieces: number) {
    this.have = new Array(totalPieces).fill(false)
  }

  getNext(availablePieces: Set<number>, inFlight: Set<number>): number | null {
    for (let i = 0; i < this.have.length; i++) {
      if (
        !this.have[i] &&
        !inFlight.has(i) &&
        availablePieces.has(i)
      ) {
        return i
      }
    }
    return null
  }

  markHave(pieceIndex: number): void {
    this.have[pieceIndex] = true
  }

  markRequested(pieceIndex: number): void {
    // no-op: estado de "em voo" é mantido externamente via inFlight set
  }

  markReceived(pieceIndex: number): void {
    this.have[pieceIndex] = true
  }

  get remaining(): number {
    return this.have.filter((h) => !h).length
  }
}
