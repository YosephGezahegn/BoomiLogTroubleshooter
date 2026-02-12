/**
 * MinHeap implementation for efficiently tracking top N items
 * Used to find the slowest shapes in log analysis
 */

export interface HeapItem<T> {
    key: number; // Comparison key (e.g., execution time)
    value: T; // Associated data
}

export class MinHeap<T> {
    private heap: HeapItem<T>[];
    private maxSize: number;

    constructor(maxSize: number) {
        this.heap = [];
        this.maxSize = maxSize;
    }

    /**
     * Insert item into heap
     * Only keeps top N items based on key value
     */
    insert(key: number, value: T): void {
        if (this.heap.length < this.maxSize) {
            // Heap not full, add item
            this.heap.push({ key, value });
            this.bubbleUp(this.heap.length - 1);
        } else if (key > this.heap[0].key) {
            // New item larger than smallest, replace smallest
            this.heap[0] = { key, value };
            this.bubbleDown(0);
        }
    }

    /**
     * Get all items sorted by key (descending)
     */
    getAll(): T[] {
        // Sort heap by key descending and return values
        return [...this.heap]
            .sort((a, b) => b.key - a.key)
            .map((item) => item.value);
    }

    /**
     * Get size of heap
     */
    size(): number {
        return this.heap.length;
    }

    /**
     * Check if heap is empty
     */
    isEmpty(): boolean {
        return this.heap.length === 0;
    }

    /**
     * Bubble up element at index to maintain heap property
     */
    private bubbleUp(index: number): void {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[index].key >= this.heap[parentIndex].key) {
                break;
            }
            this.swap(index, parentIndex);
            index = parentIndex;
        }
    }

    /**
     * Bubble down element at index to maintain heap property
     */
    private bubbleDown(index: number): void {
        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let smallest = index;

            if (
                leftChild < this.heap.length &&
                this.heap[leftChild].key < this.heap[smallest].key
            ) {
                smallest = leftChild;
            }

            if (
                rightChild < this.heap.length &&
                this.heap[rightChild].key < this.heap[smallest].key
            ) {
                smallest = rightChild;
            }

            if (smallest === index) {
                break;
            }

            this.swap(index, smallest);
            index = smallest;
        }
    }

    /**
     * Swap two elements in heap
     */
    private swap(i: number, j: number): void {
        const temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
    }

    /**
     * Clear the heap
     */
    clear(): void {
        this.heap = [];
    }
}

// Export helper function for common use case
export function getTopN<T>(
    items: Array<{ key: number; value: T }>,
    n: number
): T[] {
    const heap = new MinHeap<T>(n);
    items.forEach(({ key, value }) => heap.insert(key, value));
    return heap.getAll();
}
