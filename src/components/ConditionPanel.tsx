/**
 * 条件パネルコンポーネント
 * 検索条件の入力を担当
 */

import { useState, useEffect } from "react";
import type { SearchCondition } from "../types";
import { validateCondition } from "../utils/validateCondition";
import "./ConditionPanel.css";

interface ConditionPanelProps {
  condition: SearchCondition;
  onConditionChange: (condition: SearchCondition) => void;
}

export function ConditionPanel({
  condition,
  onConditionChange,
}: ConditionPanelProps) {
  const [maxTravelTime, setMaxTravelTime] = useState(condition.maxTravelTime);
  const [maxTransfers, setMaxTransfers] = useState(condition.maxTransfers);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>(
    [],
  );

  useEffect(() => {
    // バリデーション実行
    const newCondition: SearchCondition = {
      maxTravelTime,
      maxTransfers,
      excludedLines: condition.excludedLines,
    };

    const validationResult = validateCondition(newCondition);
    setErrors(validationResult.errors);

    // バリデーションが成功した場合のみ親に通知
    if (validationResult.isValid) {
      onConditionChange(newCondition);
    }
  }, [maxTravelTime, maxTransfers, condition.excludedLines, onConditionChange]);

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
    </div>
  );
}
