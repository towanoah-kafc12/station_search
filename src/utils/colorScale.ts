/**
 * 移動時間に応じた色分け関数
 * 緑（近い）→ 黄 → 赤（遠い）のグラデーションを生成する
 */

/**
 * 移動時間を色に変換する
 * @param travelTime 移動時間（分）
 * @param maxTravelTime 最大移動時間（分）
 * @returns RGB色文字列（例: "rgb(255, 0, 0)"）
 */
export function getTravelTimeColor(
  travelTime: number,
  maxTravelTime: number,
): string {
  // 0〜1の範囲に正規化
  const ratio = Math.min(Math.max(travelTime / maxTravelTime, 0), 1);

  let r: number, g: number, b: number;

  if (ratio < 0.5) {
    // 緑 → 黄（0〜0.5）
    const localRatio = ratio * 2; // 0〜1に拡大
    r = Math.round(154 + (255 - 154) * localRatio); // 154 → 255
    g = Math.round(205); // 205で固定
    b = Math.round(50 * (1 - localRatio)); // 50 → 0
  } else {
    // 黄 → 赤（0.5〜1）
    const localRatio = (ratio - 0.5) * 2; // 0〜1に拡大
    r = 255; // 255で固定
    g = Math.round(205 * (1 - localRatio)); // 205 → 0
    b = 0; // 0で固定
  }

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 移動時間を16進数カラーコードに変換する
 * @param travelTime 移動時間（分）
 * @param maxTravelTime 最大移動時間（分）
 * @returns 16進数カラーコード（例: "#FF0000"）
 */
export function getTravelTimeColorHex(
  travelTime: number,
  maxTravelTime: number,
): string {
  const rgb = getTravelTimeColor(travelTime, maxTravelTime);
  const match = rgb.match(/rgb\((\d+), (\d+), (\d+)\)/);

  if (!match) {
    return "#9ACD32"; // デフォルト色（緑）
  }

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
