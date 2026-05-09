import { EventEmitter } from 'events'

export class TypedEmitter<
  TEvents extends Record<string, (...args: any[]) => void>,
> {
  private emitter = new EventEmitter()

  on<TEvent extends keyof TEvents>(
    eventName: TEvent,
    listener: TEvents[TEvent],
  ): this {
    this.emitter.on(eventName as string, listener as (...args: any[]) => void)
    return this
  }

  once<TEvent extends keyof TEvents>(
    eventName: TEvent,
    listener: TEvents[TEvent],
  ): this {
    this.emitter.once(
      eventName as string,
      listener as (...args: any[]) => void,
    )
    return this
  }

  emit<TEvent extends keyof TEvents>(
    eventName: TEvent,
    ...args: Parameters<TEvents[TEvent]>
  ): boolean {
    return this.emitter.emit(eventName as string, ...args)
  }

  off<TEvent extends keyof TEvents>(
    eventName: TEvent,
    listener: TEvents[TEvent],
  ): this {
    this.emitter.off(eventName as string, listener as (...args: any[]) => void)
    return this
  }

  removeAllListeners(eventName?: keyof TEvents): this {
    this.emitter.removeAllListeners(eventName as string)
    return this
  }
}
