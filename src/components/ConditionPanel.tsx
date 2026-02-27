/**
 * 条件パネルコンポーネント
 * 検索条件の入力を担当
 */

import { useState, useEffect } from "react";
import type { SearchCondition, Line, Operator } from "../types";
import { validateCondition } from "../utils/validateCondition";
import { groupLinesByOperator } from "../utils/groupLinesByOperator";
import "./ConditionPanel.css";

interface ConditionPanelProps {
  condition: SearchCondition;
  onConditionChange: (condition: SearchCondition) => void;
  availableLines: Line[];
  availableOperators: Operator[];
}

export function ConditionPanel({
  condition,
  onConditionChange,
  availableLines,
  availableOperators,
}: ConditionPanelProps) {
  const [maxTravelTime, setMaxTravelTime] = useState(condition.maxTravelTime);
  const [maxTransfers, setMaxTransfers] = useState(condition.maxTransfers);
  const [excludedLines, setExcludedLines] = useState<string[]>(
    condition.excludedLines,
  );
  const [errors, setErrors] = useState<{ field: string; message: string }[]>(
    [],
  );
  const [showLineFilter, setShowLineFilter] = useState(false);

  // 路線を事業者ごとにグループ化
  const lineGroups = groupLinesByOperator(availableLines, availableOperators);

  useEffect(() => {
    // バリデーション実行
    const newCondition: SearchCondition = {
      maxTravelTime,
      maxTransfers,
      excludedLines,
    };

    const validationResult = validateCondition(newCondition);

    // 全路線が除外されている場合のエラーチェック
    const allLinesExcluded =
      availableLines.length > 0 &&
      excludedLines.length === availableLines.length;

    if (allLinesExcluded) {
      setErrors([
        ...validationResult.errors,
        {
          field: "excludedLines",
          message: "少なくとも1つの路線を選択してください",
        },
      ]);
    } else {
      setErrors(validationResult.errors);
    }

    // バリデーションが成功し、全路線除外でない場合のみ親に通知
    if (validationResult.isValid && !allLinesExcluded) {
      onConditionChange(newCondition);
    }
  }, [
    maxTravelTime,
    maxTransfers,
    excludedLines,
    availableLines.length,
    onConditionChange,
  ]);

  const handleTravelTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setMaxTravelTime(value);
    }
  };

  const handleTransfersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setMaxTransfers(value);
    }
  };

  const getFieldError = (field: string): string | null => {
    const error = errors.find((e) => e.field === field);
    return error ? error.message : null;
  };

  // 路線の選択状態を切り替え
  const handleLineToggle = (lineId: string) => {
    setExcludedLines((prev) => {
      if (prev.includes(lineId)) {
        // 除外リストから削除（選択状態にする）
        return prev.filter((id) => id !== lineId);
      } else {
        // 除外リストに追加（非選択状態にする）
        return [...prev, lineId];
      }
    });
  };

  // 事業者の全路線を一括選択
  const handleOperatorSelectAll = (operatorId: string) => {
    const operatorLineIds = availableLines
      .filter((line) => line.operatorId === operatorId)
      .map((line) => line.id);

    setExcludedLines((prev) =>
      prev.filter((id) => !operatorLineIds.includes(id)),
    );
  };

  // 事業者の全路線を一括解除
  const handleOperatorDeselectAll = (operatorId: string) => {
    const operatorLineIds = availableLines
      .filter((line) => line.operatorId === operatorId)
      .map((line) => line.id);

    setExcludedLines((prev) => {
      const newExcluded = new Set(prev);
      operatorLineIds.forEach((id) => newExcluded.add(id));
      return Array.from(newExcluded);
    });
  };

  // 路線が選択されているかチェック
  const isLineSelected = (lineId: string): boolean => {
    return !excludedLines.includes(lineId);
  };

  // 事業者の全路線が選択されているかチェック
  const isOperatorAllSelected = (operatorId: string): boolean => {
    const operatorLineIds = availableLines
      .filter((line) => line.operatorId === operatorId)
      .map((line) => line.id);

    return operatorLineIds.every((id) => !excludedLines.includes(id));
  };

  return (
    <div className="condition-panel">
      <h3 className="condition-panel-title">検索条件</h3>

      <div className="condition-panel-field">
        <label htmlFor="max-travel-time" className="condition-panel-label">
          最大移動時間（分）
        </label>
        <input
          id="max-travel-time"
          type="number"
          className={`condition-panel-input ${
            getFieldError("maxTravelTime") ? "error" : ""
          }`}
          min="5"
          max="120"
          value={maxTravelTime}
          onChange={handleTravelTimeChange}
        />
        <span className="condition-panel-hint">5〜120分</span>
        {getFieldError("maxTravelTime") && (
          <div className="condition-panel-error">
            {getFieldError("maxTravelTime")}
          </div>
        )}
      </div>

      <div className="condition-panel-field">
        <label htmlFor="max-transfers" className="condition-panel-label">
          最大乗り換え回数（回）
        </label>
        <input
          id="max-transfers"
          type="number"
          className={`condition-panel-input ${
            getFieldError("maxTransfers") ? "error" : ""
          }`}
          min="0"
          max="5"
          value={maxTransfers}
          onChange={handleTransfersChange}
        />
        <span className="condition-panel-hint">0〜5回</span>
        {getFieldError("maxTransfers") && (
          <div className="condition-panel-error">
            {getFieldError("maxTransfers")}
          </div>
        )}
      </div>

      {/* 路線フィルタリング */}
      <div className="condition-panel-section">
        <button
          className="condition-panel-toggle"
          onClick={() => setShowLineFilter(!showLineFilter)}
        >
          路線フィルタ {showLineFilter ? "▼" : "▶"}
        </button>

        {showLineFilter && (
          <div className="line-filter">
            {getFieldError("excludedLines") && (
              <div className="condition-panel-error">
                {getFieldError("excludedLines")}
              </div>
            )}

            {lineGroups.map((group) => (
              <div key={group.operator.id} className="line-group">
                <div className="line-group-header">
                  <span className="line-group-name">{group.operator.name}</span>
                  <div className="line-group-actions">
                    <button
                      className="line-group-button"
                      onClick={() => handleOperatorSelectAll(group.operator.id)}
                      disabled={isOperatorAllSelected(group.operator.id)}
                    >
                      全選択
                    </button>
                    <button
                      className="line-group-button"
                      onClick={() =>
                        handleOperatorDeselectAll(group.operator.id)
                      }
                      disabled={!isOperatorAllSelected(group.operator.id)}
                    >
                      全解除
                    </button>
                  </div>
                </div>
                <div className="line-group-lines">
                  {group.lines.map((line) => (
                    <label key={line.id} className="line-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isLineSelected(line.id)}
                        onChange={() => handleLineToggle(line.id)}
                      />
                      <span
                        className="line-color-indicator"
                        style={{ backgroundColor: line.color }}
                      />
                      <span className="line-name">{line.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
