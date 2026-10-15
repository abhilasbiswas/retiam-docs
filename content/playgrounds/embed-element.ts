import MyScene from '../scenes/MyScene';

// A separate name lets this bundle coexist with other scene components.
class MyRetiamSceneElement extends HTMLElement {
  private cleanup?: () => void;

  connectedCallback() {
    this.cleanup?.();
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    this.replaceChildren(canvas);
    const scene = new MyScene();
    let cancelled = false, started = false, resizeFrame = 0;
    let observer: ResizeObserver | undefined;

    this.cleanup = () => {
      cancelled = true;
      observer?.disconnect();
      cancelAnimationFrame(resizeFrame);
      if (started) scene.destroy();
      // A pending initialization cleans up in its continuation below.
    };
    void scene.start(canvas).then(() => {
      started = true;
      if (cancelled) { scene.destroy(); return; }
      observer = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          // Current composer resizing listens to the window resize event.
          window.dispatchEvent(new Event('resize'));
        });
      });
      observer.observe(this);
      this.dispatchEvent(new CustomEvent('scene-ready', { bubbles: true }));
    }).catch(error => {
      scene.destroy();
      if (!cancelled) {
        const message = document.createElement('p');
        message.setAttribute('role', 'alert');
        message.textContent = String(error);
        this.replaceChildren(message);
      }
    });
  }

  disconnectedCallback() {
    this.cleanup?.();
    this.cleanup = undefined;
  }
}

if (!customElements.get('my-retiam-scene')) {
  customElements.define('my-retiam-scene', MyRetiamSceneElement);
}
