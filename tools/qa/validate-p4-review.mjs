#!/usr/bin/env node
/**
 * マモ拳 P4独立評価の記載・合格条件だけを検証する。
 * NOT a usability, art, human-test, or iPhone simulator.
 * Usage: node tools/qa/validate-p4-review.mjs docs/mamoken-next/p4-review.actual.json
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const AXES = Object.freeze({ A: 25, B: 25, C: 15, D: 15, E: 10, F: 10 });
export const GATES = Object.freeze(["G0", "G1", "G2", "G3", "G4", "G5"]);
export const TASKS = Object.freeze(["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08"]);
const STATUSES = new Set(["PASS", "FAIL", "UNTESTED"]);
const hasEvidence = (obj) => Array.isArray(obj?.evidence) && obj.evidence.some(x => typeof x === "string" && /^https?:\/\//.test(x));
const nonempty = x => typeof x === "string" && x.trim().length > 0;

export function evaluateReview(review) {
  const errors = [];
  const failures = [];
  const pending = [];
  if (!review || typeof review !== "object" || Array.isArray(review)) return { verdict: "INVALID", score: null, errors: ["review must be an object"], failures, pending };
  const target = review.target || {};
  if (!/^[a-f0-9]{40}$/i.test(target.sha || "") || /^0{40}$/.test(target.sha || "")) pending.push("対象統合HEAD SHAが未確定");
  if (!nonempty(target.integratedPr)) pending.push("対象の統合Draft PRが未指定");
  if (review.p1Confirmed !== true) pending.push("P1本人確認未記録。P2実装を開始しない");
  if (review.p2Permission !== "CONFIRMED") pending.push("P2の着手許可未確認");
  let total = 0;
  let allScored = true;
  let minAxisPass = true;
  for (const [key, weight] of Object.entries(AXES)) {
    const axis = review.axes?.[key];
    if (axis?.score === null || axis?.score === undefined) {
      allScored = false;
      pending.push(key + ": 未採点");
      continue;
    }
    if (!Number.isInteger(axis.score) || axis.score < 0 || axis.score > 4) {
      errors.push(key + ": scoreは0〜4の整数");
      allScored = false;
      continue;
    }
    total += weight * axis.score / 4;
    if (axis.score < 3) minAxisPass = false;
    if (!nonempty(axis.rationale) || !hasEvidence(axis)) pending.push(key + ": 理由またはURL証拠なし");
  }
  for (const gate of GATES) {
    const item = review.gates?.[gate];
    if (!STATUSES.has(item?.status)) {
      errors.push(gate + ": statusはPASS/FAIL/UNTESTED");
      continue;
    }
    if (item.status === "UNTESTED") pending.push(gate + ": 未試験");
    if (item.status === "FAIL") failures.push(gate + ": 不合格");
    if (item.status === "PASS" && !hasEvidence(item)) pending.push(gate + ": PASSの裏づけURLなし");
  }
  for (const task of TASKS) {
    const item = review.tasks?.[task];
    if (!STATUSES.has(item?.status)) {
      errors.push(task + ": statusはPASS/FAIL/UNTESTED");
      continue;
    }
    if (item.status === "UNTESTED") pending.push(task + ": 実行結果なし");
    if (item.status === "FAIL") failures.push(task + ": タスク失敗");
    if (item.status === "PASS" && !hasEvidence(item)) pending.push(task + ": PASSの裏づけURLなし");
  }
  const reviewers = review.reviewers || {};
  if (!nonempty(reviewers.independent) || !nonempty(reviewers.implementer) || reviewers.independent === reviewers.implementer) {
    pending.push("独立評価者と実装担当者の分離が未証明");
  }
  if (!Number.isInteger(review.humanTesters?.novice) || review.humanTesters.novice < 1 ||
      !Number.isInteger(review.humanTesters?.experienced) || review.humanTesters.experienced < 1) {
    pending.push("実利用者：初見・格ゲー経験者それぞれ最低1名の記録がない");
  }
  if (!nonempty(review.physicalIphone?.model) || !nonempty(review.physicalIphone?.os) ||
      review.physicalIphone?.tested !== true) pending.push("物理iPhoneの機種/iOS/実測が未記録");
  if (review.ownerDecision !== "ACCEPTED") pending.push("ナギのP4採用判断が未記録");
  const issues = Array.isArray(review.issues) ? review.issues : [];
  for (const [i, issue] of issues.entries()) {
    if (issue && issue.resolved !== true && ["BLOCKER", "HIGH"].includes(issue.severity)) failures.push("重大未解決課題 #" + (i+1) + ": " + (issue.title || "(無題)"));
  }
  if (errors.length > 0) return { verdict: "INVALID", score: allScored ? total : null, errors, failures, pending };
  if (allScored && (total < 85 || !minAxisPass)) failures.push("品質スコア未達: " + total.toFixed(2) + "/100、各軸3点以上=" + minAxisPass);
  const verdict = failures.length ? "FAIL" : (pending.length ? "HOLD" : "PASS");
  return { verdict, score: allScored ? total : null, errors, failures, pending };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv[2];
  if (!path) {
    process.stderr.write("Usage: node tools/qa/validate-p4-review.mjs <review.json>\n");
    process.exitCode = 2;
  } else {
    try {
      const result = evaluateReview(JSON.parse(readFileSync(path, "utf8")));
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
      process.exitCode = result.verdict === "PASS" ? 0 : result.verdict === "INVALID" ? 2 : 1;
    } catch (error) {
      process.stderr.write("Cannot read/parse " + path + ": " + error.message + "\n");
      process.exitCode = 2;
    }
  }
}
