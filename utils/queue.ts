export class EmptyQueueException extends Error {}

export class Queue<T> {
  private array: T[] = [];

  add(data: T): void {
    this.array.push(data);
  }

  remove(): T | undefined {
    if (this.isEmpty()) throw new EmptyQueueException();
    return this.array.shift();
  }

  peek(): T {
    if (this.isEmpty()) throw new EmptyQueueException();
    return this.array[0];
  }

  isEmpty(): boolean {
    return this.array.length === 0;
  }
}
