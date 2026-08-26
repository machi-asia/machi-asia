import '@testing-library/jest-dom/vitest'

Element.prototype.scrollIntoView = () => {}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  class FakeIntersectionObserver {
    static instances: FakeIntersectionObserver[] = []

    callback: IntersectionObserverCallback
    elements = new Set<Element>()

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
      FakeIntersectionObserver.instances.push(this)
    }

    observe(target: Element) {
      this.elements.add(target)
    }

    unobserve(target: Element) {
      this.elements.delete(target)
    }

    disconnect() {
      this.elements.clear()
    }

    takeRecords(): IntersectionObserverEntry[] {
      return []
    }

    trigger(isIntersecting: boolean) {
      const entries = Array.from(this.elements).map((target) => ({
        isIntersecting,
        target,
        time: Date.now(),
        rootBounds: null,
        boundingClientRect: target.getBoundingClientRect(),
        intersectionRect: target.getBoundingClientRect(),
        intersectionRatio: isIntersecting ? 1 : 0,
      })) as IntersectionObserverEntry[]
      this.callback(entries, this as unknown as IntersectionObserver)
    }
  }
  ;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    FakeIntersectionObserver
}
