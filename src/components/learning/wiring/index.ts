// Public API der Wiring-Building-Blocks. Lessons importieren NUR von hier.
export { BreadboardCanvas } from "./breadboard-canvas";
export type { BreadboardCanvasProps } from "./breadboard-canvas";
export { BuildSpotlight, PinSpotlight, RailSpotlight } from "./build-spotlight";
export { Wire, WIRE_COLORS } from "./wire";
export { Resistor } from "./resistor";
export { Led, LED_BLINK_CSS } from "./led";
export {
  colX,
  ROW_Y_UPPER,
  ROW_Y_LOWER,
  PLUS_RAIL_Y,
  MINUS_RAIL_Y,
  BB_X,
  BB_Y,
  BB_W,
  BB_H,
  CHANNEL_TOP,
  CHANNEL_BOTTOM,
  espPinY,
  getPinY,
  getEspBodyForVariant,
  findPinCol,
  getGpioForLabel,
  BOARD_VARIANTS,
  DEFAULT_BOARD_VARIANT,
} from "./geometry";
export type { ActivePin, EspPinRef, EspPinSide, BoardVariant, BoardVariantSlug } from "./geometry";
