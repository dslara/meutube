import { SequentialPiecePicker } from '../piece-picker'

describe('PiecePicker', () => {
  test('selects first available piece', () => {
    const picker = new SequentialPiecePicker(10)
    const available = new Set([0, 1, 2])
    const inFlight = new Set()

    const next = picker.getNext(available, inFlight)
    expect(next).toBe(0)
  })

  test('skips already downloaded pieces', () => {
    const picker = new SequentialPiecePicker(10)
    picker.markHave(0)

    const available = new Set([0, 1, 2])
    const inFlight = new Set()

    const next = picker.getNext(available, inFlight)
    expect(next).toBe(1)
  })

  test('skips pieces already in flight', () => {
    const picker = new SequentialPiecePicker(10)
    const available = new Set([0, 1, 2])
    const inFlight = new Set([0])

    const next = picker.getNext(available, inFlight)
    expect(next).toBe(1)
  })

  test('returns null when all pieces downloaded', () => {
    const picker = new SequentialPiecePicker(3)
    picker.markHave(0)
    picker.markHave(1)
    picker.markHave(2)

    const available = new Set([0, 1, 2])
    const inFlight = new Set()

    const next = picker.getNext(available, inFlight)
    expect(next).toBeNull()
  })

  test('returns null when no peer has pieces', () => {
    const picker = new SequentialPiecePicker(10)
    const available = new Set<number>()
    const inFlight = new Set()

    const next = picker.getNext(available, inFlight)
    expect(next).toBeNull()
  })

  test('remaining decreases after marking have', () => {
    const picker = new SequentialPiecePicker(5)
    expect(picker.remaining).toBe(5)

    picker.markHave(0)
    expect(picker.remaining).toBe(4)

    picker.markHave(1)
    expect(picker.remaining).toBe(3)
  })
})
