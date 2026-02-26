// バリデーション結果の型定義
export interface ValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
}
