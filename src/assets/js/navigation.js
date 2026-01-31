class ChapterNavigation {
  constructor() {
    this.initKeyboardNavigation();
    this.initChapterDropdown();
    this.initSwipeNavigation();
    this.initAccessibility();
    this.initFoldEndMarkers();
  }

  initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Only activate when not in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      switch(e.key) {
        case 'ArrowLeft':
        case 'h':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            this.navigateToPrevious();
          }
          break;
        case 'ArrowRight':
        case 'l':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            this.navigateToNext();
          }
          break;
        case 'Escape':
          this.closeChapterDropdown();
          break;
        case 'Enter':
        case ' ':
          if (e.target.classList.contains('chapters-toggle')) {
            e.preventDefault();
            this.toggleChapterDropdown(e.target);
          }
          break;
      }
    });
  }

  initChapterDropdown() {
    const toggles = document.querySelectorAll('[data-toggle="chapters-list"]');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleChapterDropdown(toggle);
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.chapter-overview')) {
        this.closeChapterDropdown();
      }
    });
  }

  initSwipeNavigation() {
    let touchState = {
      startX: null,
      startY: null,
      startTime: null,
      initialSelectionLength: 0,
      isActive: false,
      hasMovedDuringTouch: false
    };

    const config = {
      minSwipeDistance: 40,        // Reduced from 80 - easier to trigger
      maxSwipeTime: 500,           // Increased from 300 - allows slower swipes
      minSwipeVelocity: 0.15,      // Reduced from 0.3 - less speed required
      maxVerticalDeviation: 30,    // Increased from 20 - more forgiving
      horizontalRatio: 1.5,        // Reduced from 2 - less strict horizontal requirement
      longPressThreshold: 500      // Time threshold for long press (text selection)
    };

    const resetTouchState = () => {
      touchState.startX = null;
      touchState.startY = null;
      touchState.startTime = null;
      touchState.initialSelectionLength = 0;
      touchState.isActive = false;
      touchState.hasMovedDuringTouch = false;
    };

    const getCurrentSelectionLength = () => {
      const selection = window.getSelection();
      return selection ? selection.toString().length : 0;
    };

    const isTextSelectionActive = () => {
      // Check if selection changed during this touch interaction
      const currentLength = getCurrentSelectionLength();
      return currentLength > 0 || currentLength !== touchState.initialSelectionLength;
    };

    document.addEventListener('touchstart', (e) => {
      resetTouchState();

      // Only handle single-finger touches
      if (e.touches.length !== 1) return;

      // Record initial selection state
      touchState.initialSelectionLength = getCurrentSelectionLength();
      touchState.startX = e.touches[0].clientX;
      touchState.startY = e.touches[0].clientY;
      touchState.startTime = Date.now();
      touchState.isActive = true;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!touchState.isActive || e.touches.length !== 1) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = Math.abs(currentX - touchState.startX);
      const deltaY = Math.abs(currentY - touchState.startY);

      touchState.hasMovedDuringTouch = true;

      // If significant vertical movement, likely scrolling
      if (deltaY > config.maxVerticalDeviation) {
        resetTouchState();
        return;
      }

      // Check if text selection is happening
      if (isTextSelectionActive()) {
        resetTouchState();
        return;
      }

      // If touch has been held long enough, it might be a text selection attempt
      const touchDuration = Date.now() - touchState.startTime;
      if (touchDuration > config.longPressThreshold && (deltaX > 5 || deltaY > 5)) {
        resetTouchState();
        return;
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (!touchState.isActive ||
          !touchState.startX ||
          !touchState.startY ||
          !touchState.startTime) {
        resetTouchState();
        return;
      }

      // Only handle single-finger touches
      if (e.changedTouches.length !== 1) {
        resetTouchState();
        return;
      }

      // Check if text selection occurred during this interaction
      if (isTextSelectionActive()) {
        resetTouchState();
        return;
      }

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();

      const deltaX = endX - touchState.startX;
      const deltaY = endY - touchState.startY;
      const deltaTime = endTime - touchState.startTime;
      const velocity = Math.abs(deltaX) / deltaTime;

      // Don't navigate if this was a long press (likely text selection attempt)
      if (deltaTime > config.longPressThreshold) {
        resetTouchState();
        return;
      }

      // Don't navigate if there was no movement (tap) or very little movement
      if (!touchState.hasMovedDuringTouch || Math.abs(deltaX) < 10) {
        resetTouchState();
        return;
      }

      // Validate swipe conditions
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * config.horizontalRatio;
      const isLongEnough = Math.abs(deltaX) > config.minSwipeDistance;
      const isFastEnough = deltaTime < config.maxSwipeTime;
      const hasMinVelocity = velocity > config.minSwipeVelocity;

      if (isHorizontalSwipe && isLongEnough && isFastEnough && hasMinVelocity) {
        // Double-check one more time that no text selection occurred
        setTimeout(() => {
          if (!isTextSelectionActive()) {
            if (deltaX > 0) {
              this.navigateToPrevious();
            } else {
              this.navigateToNext();
            }
          }
        }, 10); // Small delay to let selection events complete
      }

      resetTouchState();
    }, { passive: true });

    // Handle iOS gesture events (pinch-to-zoom)
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        resetTouchState();
      }, { passive: true });
    });

    // Listen for selection changes to immediately abort navigation
    document.addEventListener('selectionchange', () => {
      if (touchState.isActive && isTextSelectionActive()) {
        resetTouchState();
      }
    });
  }

  initAccessibility() {
    // Add skip links for screen readers
    const nav = document.querySelector('.chapter-navigation');
    if (nav) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Chapter Navigation');
    }

    // Announce page changes to screen readers
    const prevLink = document.querySelector('.nav-prev[rel="prev"]');
    const nextLink = document.querySelector('.nav-next[rel="next"]');

    if (prevLink) prevLink.setAttribute('aria-label', 'Go to previous chapter');
    if (nextLink) nextLink.setAttribute('aria-label', 'Go to next chapter');
  }

  navigateToPrevious() {
    const prevLink = document.querySelector('.nav-prev[rel="prev"]');
    if (prevLink) {
      this.fadeTransition(() => prevLink.click());
    }
  }

  navigateToNext() {
    const nextLink = document.querySelector('.nav-next[rel="next"]');
    if (nextLink) {
      this.fadeTransition(() => nextLink.click());
    }
  }

  fadeTransition(callback) {
    const content = document.querySelector('.liturgical-text');
    if (content) {
      content.classList.add('fading-out');

      setTimeout(() => {
        callback(); // Navigate to new page
      }, 150); // Half-way through the fade
    } else {
      // Fallback if no liturgical-text found
      callback();
    }
  }

  toggleChapterDropdown(toggle) {
    const dropdown = document.getElementById(toggle.getAttribute('aria-controls'));
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

    // Close any other open dropdowns first
    this.closeChapterDropdown();

    if (!isExpanded) {
      toggle.setAttribute('aria-expanded', 'true');
      dropdown.hidden = false;

      // Focus management for accessibility
      const firstChapterLink = dropdown.querySelector('.chapter-item');
      if (firstChapterLink) {
        firstChapterLink.focus();
      }
    }
  }

  closeChapterDropdown() {
    const toggles = document.querySelectorAll('[data-toggle="chapters-list"]');
    toggles.forEach(toggle => {
      const dropdown = document.getElementById(toggle.getAttribute('aria-controls'));
      if (dropdown) {
        toggle.setAttribute('aria-expanded', 'false');
        dropdown.hidden = true;
      }
    });
  }

  initFoldEndMarkers() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-fold-toggle]')) {
        const details = e.target.closest('details');
        if (details) {
          details.open = false;

          // Scroll the summary into view
          const summary = details.querySelector('summary');
          if (summary) {
            summary.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ChapterNavigation());
} else {
  new ChapterNavigation();
}
