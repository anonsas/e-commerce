import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_SEEN_KEY = "tour-seen";

type Step = { selector: string; title: string; description: string };

const STEPS: Step[] = [
  {
    selector: "#catalog",
    title: "Browse the catalog",
    description: "Filter by category and open any product for details.",
  },
  {
    selector: "[data-tour='add-to-cart']",
    title: "Add to cart",
    description: "Click Add to put an item in your cart. A notification confirms it.",
  },
  {
    selector: "[data-tour='cart']",
    title: "Your cart",
    description: "Review items and checkout here. Sandbox payments use test card 4242 4242 4242 4242.",
  },
  {
    selector: "[data-tour='auth']",
    title: "Sign in",
    description: "Sign in (or try the demo) to checkout, track orders, and chat with support.",
  },
];

function isVisible(el: Element | null): el is HTMLElement {
  return el instanceof HTMLElement && el.getClientRects().length > 0;
}

export function startTour() {
  // Skip steps whose element is hidden (e.g. nav links on mobile).
  const steps = STEPS.flatMap(({ selector, title, description }) => {
    const element = [...document.querySelectorAll(selector)].find(isVisible);
    return element ? [{ element, popover: { title, description } }] : [];
  });
  if (steps.length === 0) return;

  localStorage.setItem(TOUR_SEEN_KEY, "1");
  driver({ showProgress: true, animate: true, steps }).drive();
}

export function hasSeenTour() {
  return localStorage.getItem(TOUR_SEEN_KEY) === "1";
}
