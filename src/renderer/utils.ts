export const mod = (n: number, m: number) => ((n % m) + m) % m;

export const getTimeString = () => {
  const date = new Date();
  const h = date.getHours();
  const hh = h < 10 ? `0${h}` : h;
  const m = date.getMinutes();
  const mm = m < 10 ? `0${m}` : m;

  return `${hh}:${mm}`;
};

export const getDateString = () => {
  const date = new Date();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const computeLayout = (
  blocks: number,
  configuration: number
): string => {
  switch (blocks) {
    case 1:
      return `"app1 app1" "app1 app1"`;
    case 2:
      switch (mod(configuration, 4)) {
        case 0:
          return `"app1 app2" "app1 app2"`;
        case 1:
          return `"app1 app1" "app2 app2"`;
        case 2:
          return `"app2 app1" "app2 app1"`;
        case 3:
          return `"app2 app2" "app1 app1"`;
        default:
          return '';
      }
    case 3:
      switch (mod(configuration, 4)) {
        case 0:
          return `"app1 app2" "app1 app3"`;
        case 1:
          return `"app1 app1" "app3 app2"`;
        case 2:
          return `"app3 app1" "app2 app1"`;
        case 3:
          return `"app2 app3" "app1 app1"`;
        default:
          return '';
      }
    case 4:
      switch (mod(configuration, 4)) {
        case 0:
          return `"app1 app2" "app3 app4"`;
        case 1:
          return `"app3 app1" "app4 app2"`;
        case 2:
          return `"app4 app3" "app2 app1"`;
        case 3:
          return `"app2 app4" "app1 app3"`;
        default:
          return '';
      }
    default:
      return '';
  }
};

export class WindowQueue<T> {
  queue: { [index: number]: T };

  tail: number;

  head: number;

  size: number;

  constructor(size: number) {
    this.queue = {};
    this.head = 0;
    this.tail = 0;
    this.size = size;
  }

  enqueue(element: T) {
    this.queue[this.tail] = element;
    if (this.tail - this.head + 1 > this.size) this.dequeue();

    this.tail += 1;
  }

  dequeue() {
    if (this.tail === this.head) return undefined;

    const element = this.queue[this.head];
    delete this.queue[this.head];
    this.head += 1;
    return element;
  }

  getElements() {
    return Object.values(this.queue);
  }
}

export default {
  mod,
  computeLayout,
  getTimeString,
  getDateString,
  WindowQueue,
};
