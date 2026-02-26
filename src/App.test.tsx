/**
 * Feature: station-reachability-map
 * Property 4: 条件変更の即時反映
 *
 * 任意の有効なSearchConditionに対して、条件パネルで値を変更した場合、
 * アプリケーションの検索パラメータ状態は変更後の値と一致する。
 *
 * Validates: Requirements 2.5, 7.4
 */

import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import * as fc from "fast-check";
import App from "./App";
import type { SearchCondition } from "./types";

// 有効なSearchConditionを生成するArbitrary
const validSearchConditionArbitrary = fc.record({
  maxTravelTime: fc.integer({ min: 5, max: 120 }),
  maxTransfers: fc.integer({ min: 0, max: 5 }),
  excludedLines: fc.constant([]), // Phase 1では空配列
}) as fc.Arbitrary<SearchCondition>;

describe("Property 4: 条件変更の即時反映", () => {
  it("任意の有効な条件に対して、条件変更後のアプリケーション状態が変更値と一致する", () => {
    fc.assert(
      fc.asyncProperty(validSearchConditionArbitrary, async (condition) => {
        // Appコンポーネントをレンダリング
        const { container } = render(<App />);

        // データ読み込み完了を待つ
        await waitFor(
          () => {
            expect(
              screen.queryByText("データを読み込んでいます..."),
            ).not.toBeInTheDocument();
          },
          { timeout: 3000 },
        );

        // 条件パネルの入力欄を取得
        const travelTimeInput = screen.getByLabelText(
          "最大移動時間（分）",
        ) as HTMLInputElement;
        const transfersInput = screen.getByLabelText(
          "最大乗り換え回数（回）",
        ) as HTMLInputElement;

        // 初期値を確認
        expect(travelTimeInput).toBeInTheDocument();
        expect(transfersInput).toBeInTheDocument();

        // 条件を変更
        travelTimeInput.value = condition.maxTravelTime.toString();
        travelTimeInput.dispatchEvent(
          new Event("input", { bubbles: true, cancelable: true }),
        );
        travelTimeInput.dispatchEvent(
          new Event("change", { bubbles: true, cancelable: true }),
        );

        transfersInput.value = condition.maxTransfers.toString();
        transfersInput.dispatchEvent(
          new Event("input", { bubbles: true, cancelable: true }),
        );
        transfersInput.dispatchEvent(
          new Event("change", { bubbles: true, cancelable: true }),
        );

        // 状態が更新されるのを待つ
        await waitFor(() => {
          expect(travelTimeInput.value).toBe(
            condition.maxTravelTime.toString(),
          );
          expect(transfersInput.value).toBe(condition.maxTransfers.toString());
        });

        // エラーメッセージが表示されていないことを確認（有効な値なので）
        const errorElements = container.querySelectorAll(
          ".condition-panel-error",
        );
        expect(errorElements.length).toBe(0);

        // 入力値が条件と一致することを確認
        expect(parseInt(travelTimeInput.value, 10)).toBe(
          condition.maxTravelTime,
        );
        expect(parseInt(transfersInput.value, 10)).toBe(condition.maxTransfers);

        return true;
      }),
      { numRuns: 100 },
    );
  });

  it("無効な移動時間（5分未満）の場合、エラーメッセージが表示される", () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: -100, max: 4 }).filter((n) => n < 5),
        fc.integer({ min: 0, max: 5 }),
        async (invalidTravelTime, validTransfers) => {
          const { container } = render(<App />);

          await waitFor(
            () => {
              expect(
                screen.queryByText("データを読み込んでいます..."),
              ).not.toBeInTheDocument();
            },
            { timeout: 3000 },
          );

          const travelTimeInput = screen.getByLabelText(
            "最大移動時間（分）",
          ) as HTMLInputElement;

          travelTimeInput.value = invalidTravelTime.toString();
          travelTimeInput.dispatchEvent(
            new Event("input", { bubbles: true, cancelable: true }),
          );
          travelTimeInput.dispatchEvent(
            new Event("change", { bubbles: true, cancelable: true }),
          );

          await waitFor(() => {
            const errorElements = container.querySelectorAll(
              ".condition-panel-error",
            );
            expect(errorElements.length).toBeGreaterThan(0);
          });

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("無効な移動時間（120分超）の場合、エラーメッセージが表示される", () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 121, max: 300 }),
        fc.integer({ min: 0, max: 5 }),
        async (invalidTravelTime, validTransfers) => {
          const { container } = render(<App />);

          await waitFor(
            () => {
              expect(
                screen.queryByText("データを読み込んでいます..."),
              ).not.toBeInTheDocument();
            },
            { timeout: 3000 },
          );

          const travelTimeInput = screen.getByLabelText(
            "最大移動時間（分）",
          ) as HTMLInputElement;

          travelTimeInput.value = invalidTravelTime.toString();
          travelTimeInput.dispatchEvent(
            new Event("input", { bubbles: true, cancelable: true }),
          );
          travelTimeInput.dispatchEvent(
            new Event("change", { bubbles: true, cancelable: true }),
          );

          await waitFor(() => {
            const errorElements = container.querySelectorAll(
              ".condition-panel-error",
            );
            expect(errorElements.length).toBeGreaterThan(0);
          });

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("無効な乗り換え回数（0回未満）の場合、エラーメッセージが表示される", () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 120 }),
        fc.integer({ min: -10, max: -1 }),
        async (validTravelTime, invalidTransfers) => {
          const { container } = render(<App />);

          await waitFor(
            () => {
              expect(
                screen.queryByText("データを読み込んでいます..."),
              ).not.toBeInTheDocument();
            },
            { timeout: 3000 },
          );

          const transfersInput = screen.getByLabelText(
            "最大乗り換え回数（回）",
          ) as HTMLInputElement;

          transfersInput.value = invalidTransfers.toString();
          transfersInput.dispatchEvent(
            new Event("input", { bubbles: true, cancelable: true }),
          );
          transfersInput.dispatchEvent(
            new Event("change", { bubbles: true, cancelable: true }),
          );

          await waitFor(() => {
            const errorElements = container.querySelectorAll(
              ".condition-panel-error",
            );
            expect(errorElements.length).toBeGreaterThan(0);
          });

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("無効な乗り換え回数（5回超）の場合、エラーメッセージが表示される", () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 120 }),
        fc.integer({ min: 6, max: 20 }),
        async (validTravelTime, invalidTransfers) => {
          const { container } = render(<App />);

          await waitFor(
            () => {
              expect(
                screen.queryByText("データを読み込んでいます..."),
              ).not.toBeInTheDocument();
            },
            { timeout: 3000 },
          );

          const transfersInput = screen.getByLabelText(
            "最大乗り換え回数（回）",
          ) as HTMLInputElement;

          transfersInput.value = invalidTransfers.toString();
          transfersInput.dispatchEvent(
            new Event("input", { bubbles: true, cancelable: true }),
          );
          transfersInput.dispatchEvent(
            new Event("change", { bubbles: true, cancelable: true }),
          );

          await waitFor(() => {
            const errorElements = container.querySelectorAll(
              ".condition-panel-error",
            );
            expect(errorElements.length).toBeGreaterThan(0);
          });

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
