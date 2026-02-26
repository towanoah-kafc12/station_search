/**
 * データローダー
 * public/data/ 配下のJSONファイルを読み込む
 */

import type { Station, Line, Operator } from "../types";

/**
 * 駅データを読み込む
 */
export async function loadStations(): Promise<Station[]> {
  try {
    const response = await fetch("/data/stations.json");
    if (!response.ok) {
      throw new Error(`駅データの取得に失敗しました: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("駅データの読み込みエラー:", error);
    throw new Error("駅データを取得できませんでした。再度お試しください。");
  }
}

/**
 * 路線データを読み込む
 */
export async function loadLines(): Promise<Line[]> {
  try {
    const response = await fetch("/data/lines.json");
    if (!response.ok) {
      throw new Error(`路線データの取得に失敗しました: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("路線データの読み込みエラー:", error);
    throw new Error("路線データを取得できませんでした。再度お試しください。");
  }
}

/**
 * 事業者データを読み込む
 */
export async function loadOperators(): Promise<Operator[]> {
  try {
    const response = await fetch("/data/operators.json");
    if (!response.ok) {
      throw new Error(`事業者データの取得に失敗しました: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("事業者データの読み込みエラー:", error);
    throw new Error("事業者データを取得できませんでした。再度お試しください。");
  }
}
