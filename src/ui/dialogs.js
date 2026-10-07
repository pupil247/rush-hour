import { STRINGS } from './strings.fr.js';

// Modal layer: the victory celebration, error/retry, and a transient toast.
export function createDialogs(root) {
  let backdrop = null;

  function close() {
    if (backdrop) {
      backdrop.remove();
      backdrop = null;
    }
  }

  function open(content, { dismissable = false } = {}) {
    close();
    backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    const box = document.createElement('div');
    box.className = 'dialog';
    box.append(content);
    backdrop.append(box);
    if (dismissable) {
      backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) close();
      });
    }
    root.append(backdrop);
    return { close };
  }

  function heading(text) {
    const h = document.createElement('h2');
    h.textContent = text;
    return h;
  }

  function paragraph(text) {
    const p = document.createElement('p');
    p.textContent = text;
    return p;
  }

  return {
    close,
    showToast(text, ms = 1400) {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = text;
      root.append(toast);
      setTimeout(() => toast.remove(), ms);
    },
    showError(message, onRetry) {
      const content = document.createDocumentFragment();
      content.append(heading(STRINGS.loadError), paragraph(message));
      if (onRetry) {
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'btn primary';
        retry.textContent = STRINGS.retry;
        retry.addEventListener('click', () => {
          close();
          onRetry();
        });
        content.append(retry);
      }
      open(content);
    },
    showVictory({ moveCount, optimal, revealed, isFinal }, onContinue) {
      const content = document.createDocumentFragment();
      content.append(heading(isFinal ? STRINGS.victoryFinal : STRINGS.victoryTitle));
      content.append(paragraph(`${STRINGS.victoryYourScore} : ${moveCount}`));
      content.append(paragraph(`${STRINGS.victoryOptimal} : ${optimal}`));
      if (revealed) content.append(paragraph(STRINGS.victoryRevealed));
      const cont = document.createElement('button');
      cont.type = 'button';
      cont.className = 'btn primary';
      cont.textContent = STRINGS.backToRoadmap;
      cont.addEventListener('click', () => {
        close();
        onContinue();
      });
      content.append(cont);
      open(content);
    },
    showRevealPlayback() {
      const content = document.createDocumentFragment();
      content.append(heading(STRINGS.revealPlayback));
      return open(content);
    },
  };
}
