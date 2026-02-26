/**
 * colorScale のユニットテスト
 */

import { describe, it, expect } from "vitest";
import { getTravelTimeColor, getTravelTimeColorHex } from "./colorScale";

describe("colorScale", () => {
  describe("getTravelTimeColor", () => {
    it("移動時間0分の場合は緑系の色を返す", () => {
      const color = getTravelTimeColor(0, 60);
      expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      // 緑系（gが高い）
      const match = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
      expect(match).not.toBeNull();
      if (match) {
        const g = parseInt(match[2], 10);
        expect(g).toBeGreaterThan(150);
      }
    });

    it("移動時間が最大値の場合は赤系の色を返す", () => {
      const color = getTravelTimeColor(60, 60);
      expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      // 赤系（rが高く、gとbが低い）
      const match = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
      expect(match).not.toBeNull();
      if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        expect(r).toBeGreaterThan(200);
        expect(g).toBeLessThan(100);
      }
    });

    it("同じ移動時間に対しては常に同じ色を返す", () => {
      const color1 = getTravelTimeColor(30, 60);
      const color2 = getTravelTimeColor(30, 60);
      expect(color1).toBe(color2);
    });

    it("移動時間が大きいほど赤に近づく", () => {
      const color1 = getTravelTimeColor(10, 60);
      const color2 = getTravelTimeColor(50, 60);

      const match1 = color1.match(/rgb\((\d+), (\d+), (\d+)\)/);
      const match2 = color2.match(/rgb\((\d+), (\d+), (\d+)\)/);

      expect(match1).not.toBeNull();
      expect(match2).not.toBeNull();

      if (match1 && match2) {
        const r1 = parseInt(match1[1], 10);
        const r2 = parseInt(match2[1], 10);
        const g1 = parseInt(match1[2], 10);
        const g2 = parseInt(match2[2], 10);

        // 移動時間が大きい方がrが大きく、gが小さい
        expect(r2).toBeGreaterThanOrEqual(r1);
        expect(g2).toBeLessThanOrEqual(g1);
      }
    });
  });

  describe("getTravelTimeColorHex", () => {
    it("16進数カラーコードを返す", () => {
      const color = getTravelTimeColorHex(30, 60);
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("同じ移動時間に対しては常に同じ色を返す", () => {
      const color1 = getTravelTimeColorHex(30, 60);
      const color2 = getTravelTimeColorHex(30, 60);
      expect(color1).toBe(color2);
    });
  });
});
